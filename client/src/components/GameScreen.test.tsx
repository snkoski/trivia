import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameScreen } from './GameScreen';
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

describe('GameScreen', () => {
  const mockSubmitAnswer = vi.fn();
  const mockRequestNextQuestion = vi.fn();
  const mockSetSelectedAnswer = vi.fn();
  const mockClearSelectedAnswer = vi.fn();
  const mockSetShowResults = vi.fn();

  const mockQuestion = {
    id: 1,
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6']
  };

  const mockPlayers = [
    { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true },
    { id: 'player2', name: 'Bob', score: 0, isConnected: true, hasAnswered: false, isHost: false }
  ];

  const defaultMockSocket = {
    isConnected: true,
    error: null,
    roomCode: 'ABC123',
    currentRoom: {
      code: 'ABC123',
      players: mockPlayers,
      state: 'playing' as const,
      currentQuestionIndex: 0,
      maxPlayers: 8,
      createdAt: new Date()
    },
    players: mockPlayers,
    isHost: true,
    gameState: 'playing' as const,
    currentQuestion: mockQuestion,
    scores: { player1: 0, player2: 0 },
    correctAnswer: null,
    hasAnswered: false,
    submitAnswer: mockSubmitAnswer,
    requestNextQuestion: mockRequestNextQuestion,
    socket: { id: 'player1' },
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    startGame: vi.fn(),
    clearError: vi.fn()
  };

  const defaultMockGame = {
    questionNumber: 1,
    totalQuestions: 5,
    timeRemaining: 30,
    selectedAnswer: null,
    playerAnswers: {},
    showResults: false,
    winner: null,
    isTie: false,
    setQuestionProgress: vi.fn(),
    resetQuestionProgress: vi.fn(),
    incrementQuestion: vi.fn(),
    setSelectedAnswer: mockSetSelectedAnswer,
    clearSelectedAnswer: mockClearSelectedAnswer,
    setPlayerAnswer: vi.fn(),
    clearPlayerAnswers: vi.fn(),
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    updateTimeRemaining: vi.fn(),
    setShowResults: mockSetShowResults,
    calculateWinner: vi.fn(),
    resetGame: vi.fn(),
    formatTime: vi.fn((seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`),
    getLeaderboard: vi.fn(),
    allPlayersAnswered: vi.fn().mockReturnValue(false),
    isAnswerCorrect: vi.fn().mockReturnValue(false)
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSocket).mockReturnValue(defaultMockSocket);
    vi.mocked(useGame).mockReturnValue(defaultMockGame);
    
    // Mock HTMLAudioElement with more complete implementation
    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      currentTime: 0,
      duration: 100,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onplay: null,
      onpause: null,
      ontimeupdate: null,
      onended: null,
      src: '',
    };

    Object.defineProperty(global, 'HTMLAudioElement', {
      value: vi.fn().mockImplementation(() => mockAudio),
      writable: true,
    });

    // Mock the audio element ref
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
    });
    
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      value: vi.fn(),
      writable: true,
    });
  });

  describe('question display', () => {
    it('should display current question', () => {
      render(<GameScreen />);
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    });

    it('should display question progress', () => {
      render(<GameScreen />);
      expect(screen.getByText(/Question 1 of 5/i)).toBeInTheDocument();
    });

    it('should display all answer options', () => {
      render(<GameScreen />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('should display audio player when question has audio', () => {
      const questionWithAudio = {
        ...mockQuestion,
        audioUrl: '/audio/question1.mp3'
      };

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        currentQuestion: questionWithAudio
      });

      render(<GameScreen />);
      expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    });

    it('should not display audio player when question has no audio', () => {
      render(<GameScreen />);
      expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument();
    });
  });

  describe('timer display', () => {
    it('should display timer when timeRemaining is set', () => {
      render(<GameScreen />);
      expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    it('should not display timer when timeRemaining is null', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        timeRemaining: null
      });

      render(<GameScreen />);
      expect(screen.queryByText(/0:/)).not.toBeInTheDocument();
    });

    it('should show warning style when time is low', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        timeRemaining: 5
      });

      render(<GameScreen />);
      const timer = screen.getByText('0:05');
      expect(timer).toHaveClass('timer-warning');
    });
  });

  describe('answer selection', () => {
    it('should allow selecting an answer option', async () => {
      const user = userEvent.setup();
      render(<GameScreen />);

      const option = screen.getByRole('button', { name: /Answer option 2: 4/i });
      await user.click(option);

      expect(mockSetSelectedAnswer).toHaveBeenCalledWith(1);
    });

    it('should highlight selected answer', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        selectedAnswer: 1
      });

      render(<GameScreen />);
      const selectedOption = screen.getByRole('button', { name: /Answer option 2: 4/i });
      expect(selectedOption).toHaveClass('selected');
    });

    it('should disable answer options after answering', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        hasAnswered: true
      });

      render(<GameScreen />);
      const options = screen.getAllByRole('button', { name: /Answer option/i });
      options.forEach(option => {
        expect(option).toBeDisabled();
      });
    });

    it('should show submit button when answer is selected', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        selectedAnswer: 1
      });

      render(<GameScreen />);
      expect(screen.getByRole('button', { name: /Submit Answer/i })).toBeInTheDocument();
    });

    it('should not show submit button when no answer is selected', () => {
      render(<GameScreen />);
      expect(screen.queryByRole('button', { name: /Submit Answer/i })).not.toBeInTheDocument();
    });

    it('should call submitAnswer when submit button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        selectedAnswer: 1
      });

      render(<GameScreen />);
      
      const submitButton = screen.getByRole('button', { name: /Submit Answer/i });
      await user.click(submitButton);

      expect(mockSubmitAnswer).toHaveBeenCalledWith(1);
    });
  });

  describe('player status', () => {
    it('should display all players', () => {
      render(<GameScreen />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('should show answered status for players who have answered', () => {
      const playersWithAnswers = [
        { ...mockPlayers[0], hasAnswered: true },
        { ...mockPlayers[1], hasAnswered: false }
      ];

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        players: playersWithAnswers
      });

      render(<GameScreen />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('✓ Answered')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('⏳ Waiting')).toBeInTheDocument();
    });

    it('should show current scores', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        scores: { player1: 150, player2: 100 }
      });

      render(<GameScreen />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('results display', () => {
    it('should show results when showResults is true', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        showResults: true
      });

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        correctAnswer: 1
      });

      render(<GameScreen />);
      expect(screen.getByText(/Correct Answer: 4/i)).toBeInTheDocument();
    });

    it('should highlight correct answer in results', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        showResults: true
      });

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        correctAnswer: 1
      });

      render(<GameScreen />);
      const correctOption = screen.getByRole('button', { name: /Answer option 2: 4/i });
      expect(correctOption).toHaveClass('correct');
    });

    it('should show if user answer was correct', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        showResults: true,
        selectedAnswer: 1,
        isAnswerCorrect: vi.fn().mockReturnValue(true)
      });

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        correctAnswer: 1
      });

      render(<GameScreen />);
      expect(screen.getByText(/You got it right!/i)).toBeInTheDocument();
    });

    it('should show if user answer was incorrect', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        showResults: true,
        selectedAnswer: 0,
        isAnswerCorrect: vi.fn().mockReturnValue(false)
      });

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        correctAnswer: 1
      });

      render(<GameScreen />);
      expect(screen.getByText(/Incorrect/i)).toBeInTheDocument();
    });

    it('should show next question button for host during results', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        showResults: true
      });

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        correctAnswer: 1,
        isHost: true
      });

      render(<GameScreen />);
      expect(screen.getByRole('button', { name: /Next Question/i })).toBeInTheDocument();
    });

    it('should not show next question button for non-host', () => {
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        showResults: true
      });

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isHost: false,
        correctAnswer: 1
      });

      render(<GameScreen />);
      expect(screen.queryByRole('button', { name: /Next Question/i })).not.toBeInTheDocument();
    });

    it('should call requestNextQuestion when next button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        showResults: true
      });

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        correctAnswer: 1,
        isHost: true
      });

      render(<GameScreen />);
      
      const nextButton = screen.getByRole('button', { name: /Next Question/i });
      await user.click(nextButton);

      expect(mockRequestNextQuestion).toHaveBeenCalled();
    });
  });

  describe('game state transitions', () => {
    it('should call onGameEnd when game ends', () => {
      const onGameEnd = vi.fn();
      
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        gameState: 'finished'
      });

      render(<GameScreen onGameEnd={onGameEnd} />);
      
      expect(onGameEnd).toHaveBeenCalled();
    });

    it('should not call onGameEnd when game is still playing', () => {
      const onGameEnd = vi.fn();
      
      render(<GameScreen onGameEnd={onGameEnd} />);
      
      expect(onGameEnd).not.toHaveBeenCalled();
    });

    it('should auto-show results when all players have answered', () => {
      const allAnsweredPlayers = mockPlayers.map(p => ({ ...p, hasAnswered: true }));
      
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        players: allAnsweredPlayers,
        correctAnswer: 1
      });

      vi.mocked(useGame).mockReturnValue({
        ...defaultMockGame,
        allPlayersAnswered: vi.fn().mockReturnValue(true)
      });

      render(<GameScreen />);
      
      expect(mockSetShowResults).toHaveBeenCalledWith(true);
    });
  });

  describe('error handling', () => {
    it('should display error message when error exists', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        error: 'Failed to submit answer'
      });

      render(<GameScreen />);
      expect(screen.getByText(/Failed to submit answer/i)).toBeInTheDocument();
    });

    it('should show reconnecting message when disconnected', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isConnected: false
      });

      render(<GameScreen />);
      expect(screen.getByText(/Reconnecting/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for answer options', () => {
      render(<GameScreen />);
      
      const options = screen.getAllByRole('button', { name: /Answer option/i });
      expect(options).toHaveLength(4);
    });

    it('should have proper heading structure', () => {
      render(<GameScreen />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2); // Question progress and Players headings
    });

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      render(<GameScreen />);
      
      const firstOption = screen.getAllByRole('button')[0];
      firstOption.focus();
      
      await user.keyboard('{Enter}');
      expect(mockSetSelectedAnswer).toHaveBeenCalled();
    });
  });

  describe('audio playback', () => {
    it('should auto-play audio when question loads', () => {
      const questionWithAudio = {
        ...mockQuestion,
        audioUrl: '/audio/question1.mp3'
      };

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        currentQuestion: questionWithAudio
      });

      render(<GameScreen />);
      expect(screen.getByTestId('audio-player')).toBeInTheDocument();
    });

    it('should provide audio controls', () => {
      const questionWithAudio = {
        ...mockQuestion,
        audioUrl: '/audio/question1.mp3'
      };

      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        currentQuestion: questionWithAudio
      });

      render(<GameScreen />);
      expect(screen.getByLabelText(/Play audio/i)).toBeInTheDocument();
    });
  });
});