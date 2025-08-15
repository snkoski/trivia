import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager';
import { GameEngine } from '../services/GameEngine';
import { ClientToServerEvents, ServerToClientEvents, Question } from '../../../packages/shared/dist';
import { mockQuestions } from '../data/questions';

type SocketWithData = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: {
    playerId: string;
    playerName: string;
    currentRoom: string | null;
  };
};

export class SocketHandler {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private roomManager: RoomManager;
  private gameEngines: Map<string, GameEngine>; // roomCode -> GameEngine
  private socketPlayerMap: Map<string, string>; // socketId -> playerId

  constructor(io: SocketIOServer, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
    this.gameEngines = new Map();
    this.socketPlayerMap = new Map();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const socketWithData = socket as SocketWithData;
      
      // Initialize socket data
      socketWithData.data = {
        playerId: this.generatePlayerId(),
        playerName: '',
        currentRoom: null
      };

      this.socketPlayerMap.set(socket.id, socketWithData.data.playerId);

      console.log(`Player connected: ${socketWithData.data.playerId} (socket: ${socket.id})`);

      // Handle create room
      socket.on('create-room', (playerName: string) => {
        this.handleCreateRoom(socketWithData, playerName);
      });

      // Handle join room
      socket.on('join-room', (roomCode: string, playerName: string) => {
        this.handleJoinRoom(socketWithData, roomCode, playerName);
      });

      // Handle leave room
      socket.on('leave-room', () => {
        this.handleLeaveRoom(socketWithData);
      });

      // Handle start game
      socket.on('start-game', () => {
        this.handleStartGame(socketWithData);
      });

      // Handle submit answer
      socket.on('submit-answer', (answerIndex: number) => {
        this.handleSubmitAnswer(socketWithData, answerIndex);
      });

      // Handle next question
      socket.on('request-next-question', () => {
        this.handleNextQuestion(socketWithData);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socketWithData);
      });
    });
  }

  private handleCreateRoom(socket: SocketWithData, playerName: string) {
    try {
      socket.data.playerName = playerName;
      
      const room = this.roomManager.createRoom(socket.data.playerId, playerName);
      
      socket.data.currentRoom = room.code;
      socket.join(room.code);
      
      socket.emit('room-created', room.code);
      socket.emit('room-joined', { room, currentPlayerId: socket.data.playerId });
      
      console.log(`Room ${room.code} created by ${playerName}`);
    } catch (error) {
      socket.emit('error', 'Failed to create room');
      console.error('Create room error:', error);
    }
  }

  private handleJoinRoom(socket: SocketWithData, roomCode: string, playerName: string) {
    try {
      socket.data.playerName = playerName;
      
      const result = this.roomManager.joinRoom(roomCode, socket.data.playerId, playerName);
      
      if (!result.success) {
        socket.emit('error', result.error || 'Failed to join room');
        return;
      }

      socket.data.currentRoom = roomCode;
      socket.join(roomCode);
      
      socket.emit('room-joined', { room: result.room!, currentPlayerId: socket.data.playerId });
      
      // Notify other players in the room
      const joinedPlayer = result.room!.players.find(p => p.id === socket.data.playerId);
      socket.to(roomCode).emit('player-joined', joinedPlayer!);
      
      console.log(`${playerName} joined room ${roomCode}`);
    } catch (error) {
      socket.emit('error', 'Failed to join room');
      console.error('Join room error:', error);
    }
  }

  private handleLeaveRoom(socket: SocketWithData) {
    try {
      if (!socket.data.currentRoom) {
        return;
      }

      const roomCode = socket.data.currentRoom;
      const result = this.roomManager.leaveRoom(roomCode, socket.data.playerId);
      
      if (result.success) {
        socket.leave(roomCode);
        socket.to(roomCode).emit('player-left', socket.data.playerId);
        socket.data.currentRoom = null;
        
        // Clean up game engine if room is empty
        const room = this.roomManager.getRoom(roomCode);
        if (!room) {
          this.gameEngines.delete(roomCode);
        }
        
        console.log(`${socket.data.playerName} left room ${roomCode}`);
      }
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  private handleStartGame(socket: SocketWithData) {
    try {
      if (!socket.data.currentRoom) {
        socket.emit('error', 'Not in a room');
        return;
      }

      const room = this.roomManager.getRoom(socket.data.currentRoom);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      // Check if player is host
      const player = room.players.find(p => p.id === socket.data.playerId);
      if (!player?.isHost) {
        socket.emit('error', 'Only host can start the game');
        return;
      }

      // Create game engine for this room
      const gameEngine = new GameEngine(mockQuestions, room.players);
      this.gameEngines.set(socket.data.currentRoom, gameEngine);
      
      const result = gameEngine.startGame();
      
      if (result.success) {
        room.state = 'playing';
        this.io.to(socket.data.currentRoom).emit('game-started', result.question!);
        console.log(`Game started in room ${socket.data.currentRoom}`);
      } else {
        socket.emit('error', result.error || 'Failed to start game');
      }
    } catch (error) {
      socket.emit('error', 'Failed to start game');
      console.error('Start game error:', error);
    }
  }

  private handleSubmitAnswer(socket: SocketWithData, answerIndex: number) {
    try {
      if (!socket.data.currentRoom) {
        socket.emit('error', 'Not in a room');
        return;
      }

      const gameEngine = this.gameEngines.get(socket.data.currentRoom);
      if (!gameEngine) {
        socket.emit('error', 'Game not started');
        return;
      }

      const result = gameEngine.submitAnswer(socket.data.playerId, answerIndex);
      
      if (result.success) {
        // Notify all players that this player answered
        this.io.to(socket.data.currentRoom).emit('player-answered', socket.data.playerId);
        
        // Check if all players have answered
        const allAnswered = gameEngine.getPlayers().every(p => p.hasAnswered);
        
        if (allAnswered) {
          // Send round results to all players
          const scores = gameEngine.getScores();
          const currentQuestion = gameEngine.getQuestions()[gameEngine.getCurrentQuestionIndex()];
          
          this.io.to(socket.data.currentRoom).emit('round-results', scores, currentQuestion.correctAnswer);
        }
      } else {
        socket.emit('error', result.error || 'Failed to submit answer');
      }
    } catch (error) {
      socket.emit('error', 'Failed to submit answer');
      console.error('Submit answer error:', error);
    }
  }

  private handleNextQuestion(socket: SocketWithData) {
    try {
      if (!socket.data.currentRoom) {
        socket.emit('error', 'Not in a room');
        return;
      }

      const room = this.roomManager.getRoom(socket.data.currentRoom);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      // Check if player is host
      const player = room.players.find(p => p.id === socket.data.playerId);
      if (!player?.isHost) {
        socket.emit('error', 'Only host can advance to next question');
        return;
      }

      const gameEngine = this.gameEngines.get(socket.data.currentRoom);
      if (!gameEngine) {
        socket.emit('error', 'Game not started');
        return;
      }

      const result = gameEngine.nextQuestion();
      
      if (result.success) {
        if (result.gameFinished) {
          // Game is over
          const endResult = gameEngine.endGame();
          room.state = 'finished';
          
          this.io.to(socket.data.currentRoom).emit('game-ended', endResult.finalScores!);
          
          // Clean up game engine
          this.gameEngines.delete(socket.data.currentRoom);
          
          console.log(`Game ended in room ${socket.data.currentRoom}`);
        } else {
          // Send next question
          this.io.to(socket.data.currentRoom).emit('next-question', result.question!);
        }
      } else {
        socket.emit('error', result.error || 'Failed to advance question');
      }
    } catch (error) {
      socket.emit('error', 'Failed to advance question');
      console.error('Next question error:', error);
    }
  }

  private handleDisconnect(socket: SocketWithData) {
    try {
      console.log(`Player disconnected: ${socket.data.playerId}`);
      
      // Handle leaving room on disconnect
      if (socket.data.currentRoom) {
        this.handleLeaveRoom(socket);
      }

      this.socketPlayerMap.delete(socket.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}