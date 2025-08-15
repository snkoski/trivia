import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { socketService } from './socket';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn()
}));

describe('SocketService', () => {
  let mockSocket: any;

  beforeEach(() => {
    // Create mock socket instance
    mockSocket = {
      connected: false,
      id: 'test-socket-id',
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn()
    };

    // Make io return our mock socket
    vi.mocked(io).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
    socketService.disconnect();
  });

  describe('connection', () => {
    it('should create socket connection with correct URL and options', () => {
      socketService.connect();

      expect(io).toHaveBeenCalledWith(
        'http://localhost:3001',
        expect.objectContaining({
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        })
      );
    });

    it('should return existing socket if already connected', () => {
      mockSocket.connected = true;
      const socket1 = socketService.connect();
      const socket2 = socketService.connect();

      expect(socket1).toBe(socket2);
      expect(io).toHaveBeenCalledTimes(1);
    });

    it('should set up connection event handlers', () => {
      socketService.connect();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should disconnect socket and clear reference', () => {
      socketService.connect();
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.getSocket()).toBeNull();
    });

    it('should handle disconnect when no socket exists', () => {
      expect(() => socketService.disconnect()).not.toThrow();
    });
  });

  describe('room operations', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      socketService.connect();
    });

    it('should emit create-room event with player name', () => {
      socketService.createRoom('Alice');
      expect(mockSocket.emit).toHaveBeenCalledWith('create-room', 'Alice');
    });

    it('should emit join-room event with room code and player name', () => {
      socketService.joinRoom('ABC123', 'Bob');
      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', 'ABC123', 'Bob');
    });

    it('should emit leave-room event', () => {
      socketService.leaveRoom();
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-room');
    });

    it('should throw error when creating room without connection', () => {
      socketService.disconnect();
      expect(() => socketService.createRoom('Alice')).toThrow('Socket not connected');
    });

    it('should throw error when joining room without connection', () => {
      socketService.disconnect();
      expect(() => socketService.joinRoom('ABC123', 'Bob')).toThrow('Socket not connected');
    });

    it('should throw error when leaving room without connection', () => {
      socketService.disconnect();
      expect(() => socketService.leaveRoom()).toThrow('Socket not connected');
    });
  });

  describe('game operations', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      socketService.connect();
    });

    it('should emit start-game event', () => {
      socketService.startGame();
      expect(mockSocket.emit).toHaveBeenCalledWith('start-game');
    });

    it('should emit submit-answer event with answer index', () => {
      socketService.submitAnswer(2);
      expect(mockSocket.emit).toHaveBeenCalledWith('submit-answer', 2);
    });

    it('should emit request-next-question event', () => {
      socketService.requestNextQuestion();
      expect(mockSocket.emit).toHaveBeenCalledWith('request-next-question');
    });

    it('should throw error when starting game without connection', () => {
      socketService.disconnect();
      expect(() => socketService.startGame()).toThrow('Socket not connected');
    });

    it('should throw error when submitting answer without connection', () => {
      socketService.disconnect();
      expect(() => socketService.submitAnswer(1)).toThrow('Socket not connected');
    });

    it('should throw error when requesting next question without connection', () => {
      socketService.disconnect();
      expect(() => socketService.requestNextQuestion()).toThrow('Socket not connected');
    });
  });

  describe('event listeners', () => {
    beforeEach(() => {
      mockSocket.connected = true;
      socketService.connect();
    });

    it('should register room-created listener', () => {
      const callback = vi.fn();
      socketService.onRoomCreated(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('room-created', callback);
    });

    it('should register room-joined listener', () => {
      const callback = vi.fn();
      socketService.onRoomJoined(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('room-joined', callback);
    });

    it('should register player-joined listener', () => {
      const callback = vi.fn();
      socketService.onPlayerJoined(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('player-joined', callback);
    });

    it('should register player-left listener', () => {
      const callback = vi.fn();
      socketService.onPlayerLeft(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('player-left', callback);
    });

    it('should register game-started listener', () => {
      const callback = vi.fn();
      socketService.onGameStarted(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('game-started', callback);
    });

    it('should register next-question listener', () => {
      const callback = vi.fn();
      socketService.onNextQuestion(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('next-question', callback);
    });

    it('should register player-answered listener', () => {
      const callback = vi.fn();
      socketService.onPlayerAnswered(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('player-answered', callback);
    });

    it('should register round-results listener', () => {
      const callback = vi.fn();
      socketService.onRoundResults(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('round-results', callback);
    });

    it('should register game-ended listener', () => {
      const callback = vi.fn();
      socketService.onGameEnded(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('game-ended', callback);
    });

    it('should register error listener', () => {
      const callback = vi.fn();
      socketService.onError(callback);
      expect(mockSocket.on).toHaveBeenCalledWith('error', callback);
    });

    it('should throw error when registering listeners without connection', () => {
      socketService.disconnect();
      const callback = vi.fn();
      expect(() => socketService.onRoomCreated(callback)).toThrow('Socket not connected');
    });
  });

  describe('cleanup', () => {
    it('should remove all listeners when socket exists', () => {
      socketService.connect();
      socketService.removeAllListeners();
      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    });

    it('should handle removing listeners when no socket exists', () => {
      expect(() => socketService.removeAllListeners()).not.toThrow();
    });
  });

  describe('getSocket', () => {
    it('should return socket instance when connected', () => {
      socketService.connect();
      expect(socketService.getSocket()).toBe(mockSocket);
    });

    it('should return null when not connected', () => {
      expect(socketService.getSocket()).toBeNull();
    });
  });
});