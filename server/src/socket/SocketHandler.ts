import { Server as SocketIOServer, Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager';
import { GameEngine } from '../services/GameEngine';
import { globalLeaderboard } from '../services/GlobalLeaderboard';
import { globalLobby } from '../services/GlobalLobby';
import { ClientToServerEvents, ServerToClientEvents, Question } from '../../../packages/shared/dist';
import { mockQuestions } from '../data/questions';

type SocketWithData = Socket<ClientToServerEvents, ServerToClientEvents> & {
  data: {
    playerId: string;
    playerName: string;
    currentRoom: string | null;
    inLobby: boolean;
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
        currentRoom: null,
        inLobby: false
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

      // Handle lobby events
      socket.on('join-lobby', (playerName: string) => {
        this.handleJoinLobby(socketWithData, playerName);
      });

      socket.on('leave-lobby', () => {
        this.handleLeaveLobby(socketWithData);
      });

      socket.on('send-lobby-message', (message: string) => {
        this.handleLobbyChatMessage(socketWithData, message);
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
          
          // Submit scores to global leaderboard
          // Get scores from the game engine, not from room.players
          const gameScores = gameEngine.getScores();
          const playerScores = gameEngine.getPlayers().map(player => ({
            playerId: player.id,
            playerName: player.name,
            score: gameScores[player.id] || 0
          }));
          
          const gameId = globalLeaderboard.submitGameResults(
            mockQuestions,
            socket.data.currentRoom,
            playerScores,
            endResult.duration
          );
          
          console.log(`Game ended in room ${socket.data.currentRoom}, scores submitted to global leaderboard ${gameId}`);
          
          this.io.to(socket.data.currentRoom).emit('game-ended', endResult.finalScores!);
          
          // Clean up game engine
          this.gameEngines.delete(socket.data.currentRoom);
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

      // Handle leaving lobby on disconnect
      if (socket.data.inLobby) {
        this.handleLeaveLobby(socket);
      }

      this.socketPlayerMap.delete(socket.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  // Lobby handlers
  private handleJoinLobby(socket: SocketWithData, playerName: string) {
    try {
      socket.data.playerName = playerName;
      socket.data.inLobby = true;
      
      const player = globalLobby.addPlayer(socket.data.playerId, playerName);
      
      // Join lobby socket room
      socket.join('global-lobby');
      
      // Send chat history to new player
      const chatHistory = globalLobby.getRecentChatHistory(50);
      socket.emit('lobby-chat-history', chatHistory);
      
      // Send current players list to new player
      const allPlayers = globalLobby.getAllPlayers();
      socket.emit('lobby-players-updated', allPlayers);
      
      // Notify other lobby players
      socket.to('global-lobby').emit('lobby-player-joined', player);
      socket.to('global-lobby').emit('lobby-players-updated', allPlayers);
      
      console.log(`${playerName} joined global lobby`);
    } catch (error) {
      socket.emit('error', 'Failed to join lobby');
      console.error('Join lobby error:', error);
    }
  }

  private handleLeaveLobby(socket: SocketWithData) {
    try {
      if (!socket.data.inLobby) return;
      
      const removedPlayer = globalLobby.removePlayer(socket.data.playerId);
      
      if (removedPlayer) {
        socket.leave('global-lobby');
        socket.data.inLobby = false;
        
        // Notify remaining lobby players
        const remainingPlayers = globalLobby.getAllPlayers();
        socket.to('global-lobby').emit('lobby-player-left', socket.data.playerId);
        socket.to('global-lobby').emit('lobby-players-updated', remainingPlayers);
        
        console.log(`${removedPlayer.name} left global lobby`);
      }
    } catch (error) {
      console.error('Leave lobby error:', error);
    }
  }

  private handleLobbyChatMessage(socket: SocketWithData, messageText: string) {
    try {
      if (!socket.data.inLobby) {
        socket.emit('error', 'Not in lobby');
        return;
      }

      if (!messageText.trim()) {
        socket.emit('error', 'Message cannot be empty');
        return;
      }

      if (messageText.length > 500) {
        socket.emit('error', 'Message too long (max 500 characters)');
        return;
      }
      
      const message = globalLobby.addMessage(socket.data.playerId, messageText);
      
      // Broadcast message to all lobby players
      this.io.to('global-lobby').emit('lobby-chat-message', message);
      
      console.log(`Lobby chat from ${socket.data.playerName}: ${messageText}`);
    } catch (error) {
      socket.emit('error', 'Failed to send message');
      console.error('Lobby chat error:', error);
    }
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}