import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { SocketProvider, useSocket } from './SocketContext';
import { socketService } from '../services/socket';
import React from 'react';

// Mock the socket service
vi.mock('../services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    getSocket: vi.fn(),
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    startGame: vi.fn(),
    submitAnswer: vi.fn(),
    requestNextQuestion: vi.fn(),
    onRoomCreated: vi.fn(),
    onRoomJoined: vi.fn(),
    onPlayerJoined: vi.fn(),
    onPlayerLeft: vi.fn(),
    onGameStarted: vi.fn(),
    onNextQuestion: vi.fn(),
    onPlayerAnswered: vi.fn(),
    onRoundResults: vi.fn(),
    onGameEnded: vi.fn(),
    onError: vi.fn(),
    removeAllListeners: vi.fn()
  }
}));

describe('SocketContext', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      connected: true,
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    };
    
    vi.mocked(socketService.getSocket).mockReturnValue(mockSocket);
    vi.mocked(socketService.connect).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('SocketProvider', () => {
    it('should provide socket context to children', () => {
      const TestComponent = () => {
        const context = useSocket();
        return <div>{context ? 'Context Available' : 'No Context'}</div>;
      };

      render(
        <SocketProvider>
          <TestComponent />
        </SocketProvider>
      );

      expect(screen.getByText('Context Available')).toBeInTheDocument();
    });

    it('should connect to socket on mount', () => {
      render(
        <SocketProvider>
          <div>Test</div>
        </SocketProvider>
      );

      expect(socketService.connect).toHaveBeenCalled();
    });

    it('should set up event listeners on mount', () => {
      render(
        <SocketProvider>
          <div>Test</div>
        </SocketProvider>
      );

      expect(socketService.onRoomCreated).toHaveBeenCalled();
      expect(socketService.onRoomJoined).toHaveBeenCalled();
      expect(socketService.onPlayerJoined).toHaveBeenCalled();
      expect(socketService.onPlayerLeft).toHaveBeenCalled();
      expect(socketService.onGameStarted).toHaveBeenCalled();
      expect(socketService.onNextQuestion).toHaveBeenCalled();
      expect(socketService.onPlayerAnswered).toHaveBeenCalled();
      expect(socketService.onRoundResults).toHaveBeenCalled();
      expect(socketService.onGameEnded).toHaveBeenCalled();
      expect(socketService.onError).toHaveBeenCalled();
    });

    it('should disconnect and remove listeners on unmount', () => {
      const { unmount } = render(
        <SocketProvider>
          <div>Test</div>
        </SocketProvider>
      );

      unmount();

      expect(socketService.disconnect).toHaveBeenCalled();
      expect(socketService.removeAllListeners).toHaveBeenCalled();
    });
  });

  describe('useSocket hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useSocket();
        return null;
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<TestComponent />)).toThrow(
        'useSocket must be used within a SocketProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should provide connection status', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      expect(result.current.isConnected).toBe(true);
    });

    it('should provide socket instance', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      expect(result.current.socket).toBe(mockSocket);
    });

    it('should provide room state', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      expect(result.current.currentRoom).toBeNull();
      expect(result.current.roomCode).toBeNull();
      expect(result.current.players).toEqual([]);
      expect(result.current.isHost).toBe(false);
    });

    it('should provide game state', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      expect(result.current.gameState).toBe('waiting');
      expect(result.current.currentQuestion).toBeNull();
      expect(result.current.scores).toEqual({});
      expect(result.current.correctAnswer).toBeNull();
      expect(result.current.hasAnswered).toBe(false);
    });

    it('should provide error state', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('socket operations', () => {
    it('should handle createRoom', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        result.current.createRoom('Alice');
      });

      expect(socketService.createRoom).toHaveBeenCalledWith('Alice');
    });

    it('should handle joinRoom', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        result.current.joinRoom('ABC123', 'Bob');
      });

      expect(socketService.joinRoom).toHaveBeenCalledWith('ABC123', 'Bob');
    });

    it('should handle leaveRoom', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        result.current.leaveRoom();
      });

      expect(socketService.leaveRoom).toHaveBeenCalled();
    });

    it('should handle startGame', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        result.current.startGame();
      });

      expect(socketService.startGame).toHaveBeenCalled();
    });

    it('should handle submitAnswer', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        result.current.submitAnswer(2);
      });

      expect(socketService.submitAnswer).toHaveBeenCalledWith(2);
    });

    it('should handle requestNextQuestion', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        result.current.requestNextQuestion();
      });

      expect(socketService.requestNextQuestion).toHaveBeenCalled();
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      // First set an error through the mock
      act(() => {
        const errorCallback = vi.mocked(socketService.onError).mock.calls[0][0];
        errorCallback('Test error');
      });

      expect(result.current.error).toBe('Test error');

      // Then clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('event handling', () => {
    it('should handle room-created event', async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onRoomCreated).mock.calls[0][0];
        callback('ABC123');
      });

      expect(result.current.roomCode).toBe('ABC123');
    });

    it('should handle room-joined event', async () => {
      const mockRoom = {
        code: 'ABC123',
        players: [
          { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true }
        ],
        state: 'waiting' as const,
        currentQuestionIndex: 0,
        maxPlayers: 8,
        createdAt: new Date()
      };

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onRoomJoined).mock.calls[0][0];
        callback({ room: mockRoom, currentPlayerId: 'player1' });
      });

      expect(result.current.currentRoom).toEqual(mockRoom);
      expect(result.current.roomCode).toBe('ABC123');
      expect(result.current.players).toEqual(mockRoom.players);
      expect(result.current.currentPlayerId).toBe('player1');
    });

    it('should handle player-joined event', async () => {
      const newPlayer = { 
        id: 'player2', 
        name: 'Bob', 
        score: 0, 
        isConnected: true, 
        hasAnswered: false, 
        isHost: false 
      };

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onPlayerJoined).mock.calls[0][0];
        callback(newPlayer);
      });

      expect(result.current.players).toContainEqual(newPlayer);
    });

    it('should handle player-left event', async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      // First add some players
      const mockRoom = {
        code: 'ABC123',
        players: [
          { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true },
          { id: 'player2', name: 'Bob', score: 0, isConnected: true, hasAnswered: false, isHost: false }
        ],
        state: 'waiting' as const,
        currentQuestionIndex: 0,
        maxPlayers: 8,
        createdAt: new Date()
      };

      act(() => {
        const callback = vi.mocked(socketService.onRoomJoined).mock.calls[0][0];
        callback({ room: mockRoom, currentPlayerId: 'player1' });
      });

      // Then remove one
      act(() => {
        const callback = vi.mocked(socketService.onPlayerLeft).mock.calls[0][0];
        callback('player2');
      });

      expect(result.current.players).toHaveLength(1);
      expect(result.current.players[0].id).toBe('player1');
    });

    it('should handle game-started event', async () => {
      const mockQuestion = {
        id: 1,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6']
      };

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onGameStarted).mock.calls[0][0];
        callback(mockQuestion);
      });

      expect(result.current.gameState).toBe('playing');
      expect(result.current.currentQuestion).toEqual(mockQuestion);
      expect(result.current.hasAnswered).toBe(false);
    });

    it('should reset all players hasAnswered status on game-started', async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      // First, set up players with hasAnswered = true from previous game
      const mockRoom = {
        code: 'ABC123',
        players: [
          { id: 'player1', name: 'Alice', score: 100, isConnected: true, hasAnswered: true, isHost: true },
          { id: 'player2', name: 'Bob', score: 150, isConnected: true, hasAnswered: true, isHost: false }
        ],
        state: 'waiting' as const,
        currentQuestionIndex: 0,
        maxPlayers: 8,
        createdAt: new Date()
      };

      act(() => {
        const callback = vi.mocked(socketService.onRoomJoined).mock.calls[0][0];
        callback({ room: mockRoom, currentPlayerId: 'player1' });
      });

      expect(result.current.players[0].hasAnswered).toBe(true);
      expect(result.current.players[1].hasAnswered).toBe(true);

      // Now start a new game
      const mockQuestion = {
        id: 1,
        question: 'First question of new game',
        options: ['A', 'B', 'C', 'D']
      };

      act(() => {
        const callback = vi.mocked(socketService.onGameStarted).mock.calls[0][0];
        callback(mockQuestion);
      });

      // All players should have hasAnswered reset to false for the new game
      expect(result.current.players[0].hasAnswered).toBe(false);
      expect(result.current.players[1].hasAnswered).toBe(false);
      expect(result.current.gameState).toBe('playing');
    });

    it('should handle next-question event', async () => {
      const mockQuestion = {
        id: 2,
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid']
      };

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onNextQuestion).mock.calls[0][0];
        callback(mockQuestion);
      });

      expect(result.current.currentQuestion).toEqual(mockQuestion);
      expect(result.current.hasAnswered).toBe(false);
      expect(result.current.correctAnswer).toBeNull();
    });

    it('should reset all players hasAnswered status on next-question', async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      // First, set up players with hasAnswered = true
      const mockRoom = {
        code: 'ABC123',
        players: [
          { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: true, isHost: true },
          { id: 'player2', name: 'Bob', score: 0, isConnected: true, hasAnswered: true, isHost: false }
        ],
        state: 'playing' as const,
        currentQuestionIndex: 0,
        maxPlayers: 8,
        createdAt: new Date()
      };

      act(() => {
        const callback = vi.mocked(socketService.onRoomJoined).mock.calls[0][0];
        callback({ room: mockRoom, currentPlayerId: 'player1' });
      });

      expect(result.current.players[0].hasAnswered).toBe(true);
      expect(result.current.players[1].hasAnswered).toBe(true);

      // Now trigger next question
      const mockQuestion = {
        id: 2,
        question: 'Next question',
        options: ['A', 'B', 'C', 'D']
      };

      act(() => {
        const callback = vi.mocked(socketService.onNextQuestion).mock.calls[0][0];
        callback(mockQuestion);
      });

      // All players should have hasAnswered reset to false
      expect(result.current.players[0].hasAnswered).toBe(false);
      expect(result.current.players[1].hasAnswered).toBe(false);
    });

    it('should handle round-results event', async () => {
      const mockScores = { player1: 100, player2: 150 };
      const correctAnswer = 2;

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onRoundResults).mock.calls[0][0];
        callback(mockScores, correctAnswer);
      });

      expect(result.current.scores).toEqual(mockScores);
      expect(result.current.correctAnswer).toBe(correctAnswer);
    });

    it('should handle game-ended event', async () => {
      const finalScores = { player1: 300, player2: 250 };

      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onGameEnded).mock.calls[0][0];
        callback(finalScores);
      });

      expect(result.current.gameState).toBe('finished');
      expect(result.current.scores).toEqual(finalScores);
    });

    it('should handle error event', async () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        const callback = vi.mocked(socketService.onError).mock.calls[0][0];
        callback('Connection failed');
      });

      expect(result.current.error).toBe('Connection failed');
    });

    it('should mark hasAnswered when submitAnswer is called', () => {
      const { result } = renderHook(() => useSocket(), {
        wrapper: ({ children }) => <SocketProvider>{children}</SocketProvider>
      });

      act(() => {
        result.current.submitAnswer(1);
      });

      expect(result.current.hasAnswered).toBe(true);
    });
  });
});