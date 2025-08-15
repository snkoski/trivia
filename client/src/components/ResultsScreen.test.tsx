import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsScreen } from './ResultsScreen';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import React from 'react';

// Mock the contexts
vi.mock('../contexts/SocketContext', () => ({
  useSocket: vi.fn()
}));

vi.mock('../contexts/GameContext', () => ({
  useGame: vi.fn()
}));

describe('ResultsScreen', () => {
  const mockLeaveRoom = vi.fn();
  const mockCreateRoom = vi.fn();

  const mockPlayers = [
    { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true },
    { id: 'player2', name: 'Bob', score: 0, isConnected: true, hasAnswered: false, isHost: false },
    { id: 'player3', name: 'Charlie', score: 0, isConnected: true, hasAnswered: false, isHost: false }
  ];

  const defaultMockSocket = {
    isConnected: true,
    error: null,
    roomCode: 'ABC123',
    currentRoom: {
      code: 'ABC123',
      players: mockPlayers,
      state: 'finished' as const,
      currentQuestionIndex: 5,
      maxPlayers: 8,
      createdAt: new Date()
    },
    players: mockPlayers,
    isHost: true,
    gameState: 'finished' as const,
    currentQuestion: null,
    scores: { player1: 250, player2: 180, player3: 120 },
    correctAnswer: null,
    hasAnswered: false,
    submitAnswer: vi.fn(),
    requestNextQuestion: vi.fn(),
    socket: { id: 'player1' },
    createRoom: mockCreateRoom,
    joinRoom: vi.fn(),
    leaveRoom: mockLeaveRoom,
    startGame: vi.fn(),
    clearError: vi.fn()
  };

  const defaultMockGame = {
    questionNumber: 5,
    totalQuestions: 5,
    timeRemaining: null,
    selectedAnswer: null,
    playerAnswers: {},
    showResults: false,
    winner: 'player1',
    isTie: false,
    setQuestionProgress: vi.fn(),
    resetQuestionProgress: vi.fn(),
    incrementQuestion: vi.fn(),
    setSelectedAnswer: vi.fn(),
    clearSelectedAnswer: vi.fn(),
    setPlayerAnswer: vi.fn(),
    clearPlayerAnswers: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    updateTimeRemaining: vi.fn(),
    setShowResults: vi.fn(),
    calculateWinner: vi.fn(),
    resetGame: vi.fn(),
    formatTime: vi.fn(),
    getLeaderboard: vi.fn().mockReturnValue([
      { playerId: 'player1', playerName: 'Alice', score: 250 },
      { playerId: 'player2', playerName: 'Bob', score: 180 },
      { playerId: 'player3', playerName: 'Charlie', score: 120 }
    ]),
    allPlayersAnswered: vi.fn(),
    isAnswerCorrect: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSocket).mockReturnValue(defaultMockSocket);
    vi.mocked(useGame).mockReturnValue(defaultMockGame);
  });

  describe('game completion display', () => {
    it('should display game over title', () => {
      render(<ResultsScreen />);
      expect(screen.getByText(/Game Over/i)).toBeInTheDocument();
    });

    it('should display final scores header', () => {
      render(<ResultsScreen />);
      expect(screen.getByText(/Final Scores/i)).toBeInTheDocument();
    });

    it('should display total questions completed', () => {
      render(<ResultsScreen />);
      expect(screen.getByText(/5 questions completed/i)).toBeInTheDocument();
    });
  });

  describe('winner display', () => {
    it('should display winner announcement', () => {
      render(<ResultsScreen />);
      expect(screen.getByText(/🏆 Alice Wins!/i)).toBeInTheDocument();
    });

    it('should display tie announcement when there is a tie', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        winner: null,
        isTie: true
      });

      render(<ResultsScreen />);
      expect(screen.getByText(/🤝 It's a Tie!/i)).toBeInTheDocument();
    });

    it('should display congratulations message for winner', () => {
      render(<ResultsScreen />);
      expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
    });
  });

  describe('leaderboard display', () => {
    it('should display leaderboard with all players', () => {
      render(<ResultsScreen />);
      
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should display scores for each player', () => {
      render(<ResultsScreen />);
      
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('180')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('should show ranking positions', () => {
      render(<ResultsScreen />);
      
      expect(screen.getByText('1st')).toBeInTheDocument();
      expect(screen.getByText('2nd')).toBeInTheDocument();
      expect(screen.getByText('3rd')).toBeInTheDocument();
    });

    it('should highlight winner in leaderboard', () => {
      render(<ResultsScreen />);
      
      const winnerRow = screen.getByText('Alice').closest('.leaderboard-item');
      expect(winnerRow).toHaveClass('winner');
    });

    it('should show crown icon for first place', () => {
      render(<ResultsScreen />);
      expect(screen.getByText('👑')).toBeInTheDocument();
    });
  });

  describe('host actions', () => {
    it('should show new game button for host', () => {
      render(<ResultsScreen />);
      expect(screen.getByRole('button', { name: /New Game/i })).toBeInTheDocument();
    });

    it('should call createRoom when new game button clicked', async () => {
      const user = userEvent.setup();
      render(<ResultsScreen />);
      
      const newGameButton = screen.getByRole('button', { name: /New Game/i });
      await user.click(newGameButton);
      
      expect(mockCreateRoom).toHaveBeenCalledWith('Alice');
    });

    it('should not show new game button for non-host', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isHost: false,
        socket: { id: 'player2' }
      });

      render(<ResultsScreen />);
      expect(screen.queryByRole('button', { name: /New Game/i })).not.toBeInTheDocument();
    });
  });

  describe('room actions', () => {
    it('should show leave room button', () => {
      render(<ResultsScreen />);
      expect(screen.getByRole('button', { name: /Leave Room/i })).toBeInTheDocument();
    });

    it('should call leaveRoom when leave button clicked', async () => {
      const user = userEvent.setup();
      render(<ResultsScreen />);
      
      const leaveButton = screen.getByRole('button', { name: /Leave Room/i });
      await user.click(leaveButton);
      
      expect(mockLeaveRoom).toHaveBeenCalled();
    });

    it('should call onLeaveRoom callback when leaving', async () => {
      const onLeaveRoom = vi.fn();
      const user = userEvent.setup();
      
      render(<ResultsScreen onLeaveRoom={onLeaveRoom} />);
      
      const leaveButton = screen.getByRole('button', { name: /Leave Room/i });
      await user.click(leaveButton);
      
      expect(onLeaveRoom).toHaveBeenCalled();
    });
  });

  describe('room information', () => {
    it('should display room code', () => {
      render(<ResultsScreen />);
      expect(screen.getByText(/Room: ABC123/i)).toBeInTheDocument();
    });

    it('should display player count', () => {
      render(<ResultsScreen />);
      expect(screen.getByText(/3 Players/i)).toBeInTheDocument();
    });
  });

  describe('game stats', () => {
    it('should display average score when multiple players', () => {
      render(<ResultsScreen />);
      const avgScore = Math.round((250 + 180 + 120) / 3);
      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText(avgScore.toString())).toBeInTheDocument();
    });

    it('should not display average score with single player', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        players: [mockPlayers[0]],
        scores: { player1: 250 }
      });

      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        getLeaderboard: vi.fn().mockReturnValue([
          { playerId: 'player1', playerName: 'Alice', score: 250 }
        ])
      });

      render(<ResultsScreen />);
      expect(screen.queryByText(/Average:/i)).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error message when error exists', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        error: 'Failed to start new game'
      });
      
      render(<ResultsScreen />);
      expect(screen.getByText(/Failed to start new game/i)).toBeInTheDocument();
    });

    it('should show reconnecting message when disconnected', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isConnected: false
      });
      
      render(<ResultsScreen />);
      expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
    });
  });

  describe('navigation callbacks', () => {
    it('should call onNewGame callback when new game started', async () => {
      const onNewGame = vi.fn();
      const user = userEvent.setup();
      
      render(<ResultsScreen onNewGame={onNewGame} />);
      
      const newGameButton = screen.getByRole('button', { name: /New Game/i });
      await user.click(newGameButton);
      
      expect(onNewGame).toHaveBeenCalled();
    });

    it('should not call onNewGame for non-host', () => {
      const onNewGame = vi.fn();
      
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isHost: false
      });
      
      render(<ResultsScreen onNewGame={onNewGame} />);
      expect(onNewGame).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(<ResultsScreen />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3); // Winner announcement, Final Scores, and Game Stats
    });

    it('should have proper list structure for leaderboard', () => {
      render(<ResultsScreen />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have keyboard accessible buttons', async () => {
      const user = userEvent.setup();
      render(<ResultsScreen />);
      
      const leaveButton = screen.getByRole('button', { name: /Leave Room/i });
      leaveButton.focus();
      
      await user.keyboard('{Enter}');
      expect(mockLeaveRoom).toHaveBeenCalled();
    });
  });
});