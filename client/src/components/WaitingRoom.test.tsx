import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WaitingRoom } from './WaitingRoom';
import { useSocket } from '../contexts/SocketContext';
import React from 'react';

// Mock the SocketContext
vi.mock('../contexts/SocketContext', () => ({
  useSocket: vi.fn()
}));

describe('WaitingRoom', () => {
  const mockStartGame = vi.fn();
  const mockLeaveRoom = vi.fn();

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

  const defaultMockSocket = {
    isConnected: true,
    error: null,
    roomCode: 'ABC123',
    currentRoom: mockRoom,
    players: mockRoom.players,
    isHost: true,
    gameState: 'waiting' as const,
    startGame: mockStartGame,
    leaveRoom: mockLeaveRoom,
    socket: { id: 'player1' },
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    currentQuestion: null,
    scores: {},
    correctAnswer: null,
    hasAnswered: false,
    submitAnswer: vi.fn(),
    requestNextQuestion: vi.fn(),
    clearError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSocket).mockReturnValue(defaultMockSocket);
  });

  describe('room information', () => {
    it('should display room code', () => {
      render(<WaitingRoom />);
      expect(screen.getByText(/Room Code:/i)).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    it('should display room code as copyable text', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      const mockWriteText = vi.fn();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockWriteText
        },
        writable: true
      });
      
      render(<WaitingRoom />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);
      
      expect(mockWriteText).toHaveBeenCalledWith('ABC123');
    });

    it('should display player count', () => {
      render(<WaitingRoom />);
      expect(screen.getByText(/2 \/ 8 Players/i)).toBeInTheDocument();
    });

    it('should display waiting for players message', () => {
      render(<WaitingRoom />);
      expect(screen.getByText(/Waiting for players/i)).toBeInTheDocument();
    });
  });

  describe('player list', () => {
    it('should display all players', () => {
      render(<WaitingRoom />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should show host indicator for host player', () => {
      render(<WaitingRoom />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Host')).toBeInTheDocument();
    });

    it('should show connection status for each player', () => {
      const mockSocketWithDisconnectedPlayer = {
        ...defaultMockSocket,
        currentRoom: {
          ...mockRoom,
          players: [
            { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true },
            { id: 'player2', name: 'Bob', score: 0, isConnected: false, hasAnswered: false, isHost: false }
          ]
        },
        players: [
          { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true },
          { id: 'player2', name: 'Bob', score: 0, isConnected: false, hasAnswered: false, isHost: false }
        ]
      };

      vi.mocked(useSocket).mockReturnValue(mockSocketWithDisconnectedPlayer);
      
      render(<WaitingRoom />);
      expect(screen.getByText('● Connected')).toBeInTheDocument();
      expect(screen.getByText('○ Disconnected')).toBeInTheDocument();
    });

    it('should display empty state when no other players', () => {
      const mockSocketSinglePlayer = {
        ...defaultMockSocket,
        currentRoom: {
          ...mockRoom,
          players: [
            { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true }
          ]
        },
        players: [
          { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true }
        ]
      };

      vi.mocked(useSocket).mockReturnValue(mockSocketSinglePlayer);
      
      render(<WaitingRoom />);
      expect(screen.getByText(/Share the room code/i)).toBeInTheDocument();
    });
  });

  describe('game controls for host', () => {
    it('should show start game button for host', () => {
      render(<WaitingRoom />);
      expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();
    });

    it('should call startGame when start button clicked by host', async () => {
      const user = userEvent.setup();
      render(<WaitingRoom />);
      
      const startButton = screen.getByRole('button', { name: /Start Game/i });
      await user.click(startButton);
      
      expect(mockStartGame).toHaveBeenCalled();
    });

    it('should enable start button with one player (single-player mode)', () => {
      const mockSocketSinglePlayer = {
        ...defaultMockSocket,
        currentRoom: {
          ...mockRoom,
          players: [
            { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true }
          ]
        },
        players: [
          { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true }
        ]
      };

      vi.mocked(useSocket).mockReturnValue(mockSocketSinglePlayer);
      
      render(<WaitingRoom />);
      const startButton = screen.getByRole('button', { name: /Start Game/i });
      expect(startButton).not.toBeDisabled();
    });

    it('should show minimum players message when no players', () => {
      const mockSocketNoPlayers = {
        ...defaultMockSocket,
        currentRoom: {
          ...mockRoom,
          players: []
        },
        players: []
      };

      vi.mocked(useSocket).mockReturnValue(mockSocketNoPlayers);
      
      render(<WaitingRoom />);
      expect(screen.getByText(/Need at least 1 players to start/i)).toBeInTheDocument();
    });
  });

  describe('game controls for non-host', () => {
    beforeEach(() => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isHost: false,
        socket: { id: 'player2' }
      });
    });

    it('should not show start game button for non-host', () => {
      render(<WaitingRoom />);
      expect(screen.queryByRole('button', { name: /Start Game/i })).not.toBeInTheDocument();
    });

    it('should show waiting for host message for non-host', () => {
      render(<WaitingRoom />);
      expect(screen.getByText(/Waiting for host to start the game/i)).toBeInTheDocument();
    });
  });

  describe('room actions', () => {
    it('should show leave room button', () => {
      render(<WaitingRoom />);
      expect(screen.getByRole('button', { name: /Leave Room/i })).toBeInTheDocument();
    });

    it('should call leaveRoom when leave button clicked', async () => {
      const user = userEvent.setup();
      render(<WaitingRoom />);
      
      const leaveButton = screen.getByRole('button', { name: /Leave Room/i });
      await user.click(leaveButton);
      
      expect(mockLeaveRoom).toHaveBeenCalled();
    });

    it('should call onLeaveRoom callback when leaving', async () => {
      const onLeaveRoom = vi.fn();
      const user = userEvent.setup();
      
      render(<WaitingRoom onLeaveRoom={onLeaveRoom} />);
      
      const leaveButton = screen.getByRole('button', { name: /Leave Room/i });
      await user.click(leaveButton);
      
      expect(onLeaveRoom).toHaveBeenCalled();
    });
  });

  describe('game state changes', () => {
    it('should call onGameStart when game starts', () => {
      const onGameStart = vi.fn();
      
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        gameState: 'playing'
      });
      
      render(<WaitingRoom onGameStart={onGameStart} />);
      
      expect(onGameStart).toHaveBeenCalled();
    });

    it('should not call onGameStart when game is still waiting', () => {
      const onGameStart = vi.fn();
      
      render(<WaitingRoom onGameStart={onGameStart} />);
      
      expect(onGameStart).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should display error message when error exists', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        error: 'Failed to start game'
      });
      
      render(<WaitingRoom />);
      expect(screen.getByText(/Failed to start game/i)).toBeInTheDocument();
    });

    it('should show reconnecting message when disconnected', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isConnected: false
      });
      
      render(<WaitingRoom />);
      expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
    });
  });

  describe('player updates', () => {
    it('should update player list when new player joins', () => {
      const { rerender } = render(<WaitingRoom />);
      
      // Simulate new player joining
      const updatedMockSocket = {
        ...defaultMockSocket,
        currentRoom: {
          ...mockRoom,
          players: [
            ...mockRoom.players,
            { id: 'player3', name: 'Charlie', score: 0, isConnected: true, hasAnswered: false, isHost: false }
          ]
        },
        players: [
          ...mockRoom.players,
          { id: 'player3', name: 'Charlie', score: 0, isConnected: true, hasAnswered: false, isHost: false }
        ]
      };

      vi.mocked(useSocket).mockReturnValue(updatedMockSocket);
      rerender(<WaitingRoom />);
      
      expect(screen.getByText('Charlie')).toBeInTheDocument();
      expect(screen.getByText(/3 \/ 8 Players/i)).toBeInTheDocument();
    });

    it('should update player list when player leaves', () => {
      const { rerender } = render(<WaitingRoom />);
      
      // Simulate player leaving
      const updatedMockSocket = {
        ...defaultMockSocket,
        currentRoom: {
          ...mockRoom,
          players: [mockRoom.players[0]] // Only Alice remains
        },
        players: [mockRoom.players[0]]
      };

      vi.mocked(useSocket).mockReturnValue(updatedMockSocket);
      rerender(<WaitingRoom />);
      
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      expect(screen.getByText(/1 \/ 8 Players/i)).toBeInTheDocument();
    });
  });
});