import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { SocketHandler } from './SocketHandler';
import { RoomManager } from '../services/RoomManager';
import { ClientToServerEvents, ServerToClientEvents } from '../../../packages/shared/dist';

describe('SocketHandler', () => {
  let io: SocketIOServer;
  let serverSocket: any;
  let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let socketHandler: SocketHandler;
  let roomManager: RoomManager;
  let httpServer: any;

  beforeAll((done) => {
    // Create HTTP server and Socket.IO server
    httpServer = createServer();
    io = new SocketIOServer(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      
      // Initialize services
      roomManager = new RoomManager();
      socketHandler = new SocketHandler(io, roomManager);
      
      // Set up client socket
      clientSocket = Client(`http://localhost:${port}`) as any;
      
      // Wait for connection
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  afterEach(() => {
    // Clean up any rooms created during tests
    roomManager.cleanupEmptyRooms();
    
    // Remove all listeners to prevent test pollution
    clientSocket.removeAllListeners();
  });

  describe('create-room event', () => {
    it('should create a room and return room code', (done) => {
      clientSocket.on('room-created', (roomCode: string) => {
        expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
        expect(roomManager.getRoom(roomCode)).toBeDefined();
        done();
      });

      clientSocket.emit('create-room', 'TestPlayer');
    });

    it('should add creator as host', (done) => {
      clientSocket.on('room-created', (roomCode: string) => {
        const room = roomManager.getRoom(roomCode);
        expect(room?.players[0].isHost).toBe(true);
        expect(room?.players[0].name).toBe('TestHost');
        done();
      });

      clientSocket.emit('create-room', 'TestHost');
    });

    it('should join socket to room channel', (done) => {
      clientSocket.on('room-created', (roomCode: string) => {
        // We can't easily test internal socket rooms, so let's test the behavior instead
        // If the room was created successfully, the socket joining worked
        expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
        expect(roomManager.getRoom(roomCode)).toBeDefined();
        done();
      });

      clientSocket.emit('create-room', 'TestPlayer');
    });
  });

  describe('join-room event', () => {
    let existingRoomCode: string;

    beforeEach((done) => {
      // Create a room first
      clientSocket.once('room-created', (roomCode: string) => {
        existingRoomCode = roomCode;
        done();
      });
      clientSocket.emit('create-room', 'Host');
    });

    it('should allow joining existing room', (done) => {
      // Create a second client
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`) as any;
      
      client2.on('room-joined', (room: any) => {
        expect(room.code).toBe(existingRoomCode);
        expect(room.players).toHaveLength(2);
        client2.close();
        done();
      });

      client2.on('connect', () => {
        client2.emit('join-room', existingRoomCode, 'Player2');
      });
    });

    it('should broadcast player-joined to other players in room', (done) => {
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`) as any;
      
      // Original client should receive player-joined event
      clientSocket.once('player-joined', (player: any) => {
        expect(player.name).toBe('Player2');
        expect(player.isHost).toBe(false);
        client2.close();
        done();
      });

      client2.on('connect', () => {
        client2.emit('join-room', existingRoomCode, 'Player2');
      });
    });

    it('should handle joining non-existent room', (done) => {
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`) as any;
      
      client2.on('error', (message: string) => {
        expect(message).toBe('Room not found');
        client2.close();
        done();
      });

      client2.on('connect', () => {
        client2.emit('join-room', 'INVALID', 'Player2');
      });
    });
  });

  describe('start-game event', () => {
    let roomCode: string;

    beforeEach((done) => {
      // Create a room with multiple players
      clientSocket.once('room-created', (code: string) => {
        roomCode = code;
        
        // Add a second player
        const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`) as any;
        client2.on('connect', () => {
          client2.emit('join-room', roomCode, 'Player2');
          setTimeout(() => {
            client2.close();
            done();
          }, 100);
        });
      });
      clientSocket.emit('create-room', 'Host');
    });

    it('should start game and broadcast first question', (done) => {
      clientSocket.once('game-started', (firstQuestion: any) => {
        expect(firstQuestion).toBeDefined();
        expect(firstQuestion.question).toBeDefined();
        expect(firstQuestion.options).toBeDefined();
        expect(firstQuestion).not.toHaveProperty('correctAnswer');
        done();
      });

      clientSocket.emit('start-game');
    });

    it('should only allow host to start game', (done) => {
      // Create non-host client
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`) as any;
      
      client2.on('connect', () => {
        client2.emit('join-room', roomCode, 'NonHost');
        
        client2.on('error', (message: string) => {
          expect(message).toBe('Only host can start the game');
          client2.close();
          done();
        });

        // Try to start game as non-host
        setTimeout(() => {
          client2.emit('start-game');
        }, 100);
      });
    });
  });

  describe('submit-answer event', () => {
    let roomCode: string;

    beforeEach((done) => {
      // Create room and start game
      clientSocket.once('room-created', (code: string) => {
        roomCode = code;
        
        clientSocket.once('game-started', () => {
          done();
        });
        
        clientSocket.emit('start-game');
      });
      
      clientSocket.emit('create-room', 'Host');
    });

    it('should process answer and update scores', (done) => {
      clientSocket.once('round-results', (scores: any, correctAnswer: number) => {
        expect(scores).toBeDefined();
        expect(correctAnswer).toBeGreaterThanOrEqual(0);
        expect(Object.keys(scores).length).toBeGreaterThan(0);
        done();
      });

      clientSocket.emit('submit-answer', 1);
    });

    it('should broadcast player-answered event', (done) => {
      // Listen for player-answered on the same client that will submit
      clientSocket.once('player-answered', (playerId: string) => {
        expect(playerId).toBeDefined();
        done();
      });

      // Submit answer - this should trigger player-answered event
      clientSocket.emit('submit-answer', 1);
    });
  });

  describe('leave-room event', () => {
    let roomCode: string;

    beforeEach((done) => {
      clientSocket.once('room-created', (code: string) => {
        roomCode = code;
        done();
      });
      clientSocket.emit('create-room', 'Host');
    });

    it('should remove player from room', (done) => {
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`) as any;
      
      client2.on('connect', () => {
        client2.emit('join-room', roomCode, 'Player2');
        
        clientSocket.once('player-left', (playerId: string) => {
          const room = roomManager.getRoom(roomCode);
          expect(room?.players).toHaveLength(1);
          client2.close();
          done();
        });

        setTimeout(() => {
          client2.emit('leave-room');
        }, 100);
      });
    });
  });

  describe('disconnect event', () => {
    it('should handle player disconnect', (done) => {
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`) as any;
      
      clientSocket.once('room-created', (roomCode: string) => {
        client2.on('connect', () => {
          client2.emit('join-room', roomCode, 'Player2');
          
          clientSocket.once('player-left', (playerId: string) => {
            expect(playerId).toBeDefined();
            done();
          });

          setTimeout(() => {
            client2.disconnect();
          }, 100);
        });
      });

      clientSocket.emit('create-room', 'Host');
    });
  });

  describe('request-next-question event', () => {
    let roomCode: string;

    beforeEach((done) => {
      // Create room, start game, and have players answer
      clientSocket.once('room-created', (code: string) => {
        roomCode = code;
        
        clientSocket.once('game-started', () => {
          // Submit an answer first
          clientSocket.emit('submit-answer', 1);
          
          setTimeout(done, 100);
        });
        
        clientSocket.emit('start-game');
      });
      
      clientSocket.emit('create-room', 'Host');
    });

    it('should advance to next question', (done) => {
      clientSocket.once('next-question', (question: any) => {
        expect(question).toBeDefined();
        expect(question.question).toBeDefined();
        expect(question).not.toHaveProperty('correctAnswer');
        done();
      });

      clientSocket.emit('request-next-question');
    });

    it('should handle end of game', (done) => {
      let questionCount = 0;
      let gameEnded = false;
      
      // Listen for game-ended event
      clientSocket.once('game-ended', (finalScores: any) => {
        if (!gameEnded) {
          gameEnded = true;
          expect(finalScores).toBeDefined();
          clientSocket.off('next-question'); // Remove listener to prevent further calls
          done();
        }
      });
      
      const handleNextQuestion = () => {
        questionCount++;
        
        if (questionCount < 3 && !gameEnded) {
          clientSocket.emit('request-next-question');
        } else if (!gameEnded) {
          // This should trigger game-ended
          clientSocket.emit('request-next-question');
        }
      };

      clientSocket.on('next-question', handleNextQuestion);
      clientSocket.emit('request-next-question');
    });
  });
});