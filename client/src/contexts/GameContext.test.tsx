import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGame } from './GameContext';
import React from 'react';

describe('GameContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GameProvider', () => {
    it('should provide game context to children', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      expect(result.current).toBeDefined();
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => renderHook(() => useGame())).toThrow(
        'useGame must be used within a GameProvider'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      expect(result.current.questionNumber).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.timeRemaining).toBeNull();
      expect(result.current.selectedAnswer).toBeNull();
      expect(result.current.showResults).toBe(false);
      expect(result.current.winner).toBeNull();
      expect(result.current.isTie).toBe(false);
      expect(result.current.playerAnswers).toEqual({});
    });
  });

  describe('question management', () => {
    it('should set question number and total', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setQuestionProgress(3, 10);
      });

      expect(result.current.questionNumber).toBe(3);
      expect(result.current.totalQuestions).toBe(10);
    });

    it('should reset question number', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setQuestionProgress(5, 10);
        result.current.resetQuestionProgress();
      });

      expect(result.current.questionNumber).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
    });

    it('should increment question number', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setQuestionProgress(1, 10);
        result.current.incrementQuestion();
      });

      expect(result.current.questionNumber).toBe(2);
    });
  });

  describe('answer management', () => {
    it('should set selected answer', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setSelectedAnswer(2);
      });

      expect(result.current.selectedAnswer).toBe(2);
    });

    it('should clear selected answer', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setSelectedAnswer(2);
        result.current.clearSelectedAnswer();
      });

      expect(result.current.selectedAnswer).toBeNull();
    });

    it('should track player answers', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setPlayerAnswer('player1', 2);
        result.current.setPlayerAnswer('player2', 3);
      });

      expect(result.current.playerAnswers).toEqual({
        'player1': 2,
        'player2': 3
      });
    });

    it('should clear all player answers', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setPlayerAnswer('player1', 2);
        result.current.setPlayerAnswer('player2', 3);
        result.current.clearPlayerAnswers();
      });

      expect(result.current.playerAnswers).toEqual({});
    });
  });

  describe('timer management', () => {
    it('should start timer with initial time', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.startTimer(30);
      });

      expect(result.current.timeRemaining).toBe(30);
    });

    it('should stop timer', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.startTimer(30);
        result.current.stopTimer();
      });

      expect(result.current.timeRemaining).toBeNull();
    });

    it('should update time remaining', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.startTimer(30);
        result.current.updateTimeRemaining(25);
      });

      expect(result.current.timeRemaining).toBe(25);
    });
  });

  describe('results management', () => {
    it('should show and hide results', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.setShowResults(true);
      });

      expect(result.current.showResults).toBe(true);

      act(() => {
        result.current.setShowResults(false);
      });

      expect(result.current.showResults).toBe(false);
    });
  });

  describe('winner calculation', () => {
    it('should calculate single winner', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      const scores = {
        'player1': 100,
        'player2': 200,
        'player3': 150
      };

      const players = [
        { id: 'player1', name: 'Alice', score: 100, isConnected: true, hasAnswered: false, isHost: true },
        { id: 'player2', name: 'Bob', score: 200, isConnected: true, hasAnswered: false, isHost: false },
        { id: 'player3', name: 'Charlie', score: 150, isConnected: true, hasAnswered: false, isHost: false }
      ];

      act(() => {
        result.current.calculateWinner(scores, players);
      });

      expect(result.current.winner).toEqual({
        id: 'player2',
        name: 'Bob',
        score: 200
      });
      expect(result.current.isTie).toBe(false);
    });

    it('should handle tie between multiple winners', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      const scores = {
        'player1': 200,
        'player2': 200,
        'player3': 150
      };

      const players = [
        { id: 'player1', name: 'Alice', score: 200, isConnected: true, hasAnswered: false, isHost: true },
        { id: 'player2', name: 'Bob', score: 200, isConnected: true, hasAnswered: false, isHost: false },
        { id: 'player3', name: 'Charlie', score: 150, isConnected: true, hasAnswered: false, isHost: false }
      ];

      act(() => {
        result.current.calculateWinner(scores, players);
      });

      expect(result.current.winner).toBeNull();
      expect(result.current.isTie).toBe(true);
      expect(result.current.tiedWinners).toEqual([
        { id: 'player1', name: 'Alice', score: 200 },
        { id: 'player2', name: 'Bob', score: 200 }
      ]);
    });

    it('should handle empty scores', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      act(() => {
        result.current.calculateWinner({}, []);
      });

      expect(result.current.winner).toBeNull();
      expect(result.current.isTie).toBe(false);
    });
  });

  describe('game reset', () => {
    it('should reset all game state', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      // Set various states
      act(() => {
        result.current.setQuestionProgress(5, 10);
        result.current.setSelectedAnswer(2);
        result.current.setPlayerAnswer('player1', 3);
        result.current.startTimer(30);
        result.current.setShowResults(true);
        result.current.calculateWinner({ 'player1': 100 }, [
          { id: 'player1', name: 'Alice', score: 100, isConnected: true, hasAnswered: false, isHost: true }
        ]);
      });

      // Reset everything
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.questionNumber).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.selectedAnswer).toBeNull();
      expect(result.current.playerAnswers).toEqual({});
      expect(result.current.timeRemaining).toBeNull();
      expect(result.current.showResults).toBe(false);
      expect(result.current.winner).toBeNull();
      expect(result.current.isTie).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should format time correctly', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      expect(result.current.formatTime(65)).toBe('1:05');
      expect(result.current.formatTime(30)).toBe('0:30');
      expect(result.current.formatTime(5)).toBe('0:05');
      expect(result.current.formatTime(0)).toBe('0:00');
    });

    it('should get leaderboard sorted by score', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      const scores = {
        'player1': 100,
        'player2': 300,
        'player3': 200
      };

      const players = [
        { id: 'player1', name: 'Alice', score: 100, isConnected: true, hasAnswered: false, isHost: true },
        { id: 'player2', name: 'Bob', score: 300, isConnected: true, hasAnswered: false, isHost: false },
        { id: 'player3', name: 'Charlie', score: 200, isConnected: true, hasAnswered: false, isHost: false }
      ];

      const leaderboard = result.current.getLeaderboard(scores, players);

      expect(leaderboard).toEqual([
        { id: 'player2', name: 'Bob', score: 300, rank: 1 },
        { id: 'player3', name: 'Charlie', score: 200, rank: 2 },
        { id: 'player1', name: 'Alice', score: 100, rank: 3 }
      ]);
    });

    it('should check if all players have answered', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      const playersNotAllAnswered = [
        { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: true, isHost: true },
        { id: 'player2', name: 'Bob', score: 0, isConnected: true, hasAnswered: false, isHost: false }
      ];

      const playersAllAnswered = [
        { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: true, isHost: true },
        { id: 'player2', name: 'Bob', score: 0, isConnected: true, hasAnswered: true, isHost: false }
      ];

      expect(result.current.allPlayersAnswered(playersNotAllAnswered)).toBe(false);
      expect(result.current.allPlayersAnswered(playersAllAnswered)).toBe(true);
    });

    it('should check if answer is correct', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      expect(result.current.isAnswerCorrect(2, 2)).toBe(true);
      expect(result.current.isAnswerCorrect(1, 2)).toBe(false);
      expect(result.current.isAnswerCorrect(null, 2)).toBe(false);
      expect(result.current.isAnswerCorrect(2, null)).toBe(false);
    });

    it('should handle undefined scores in getLeaderboard', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      const players = [
        { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true }
      ];

      expect(result.current.getLeaderboard(undefined as any, players)).toEqual([]);
      expect(result.current.getLeaderboard(null as any, players)).toEqual([]);
    });

    it('should return sorted leaderboard with ranks', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      const scores = { player1: 150, player2: 200, player3: 100 };
      const players = [
        { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true },
        { id: 'player2', name: 'Bob', score: 0, isConnected: true, hasAnswered: false, isHost: false },
        { id: 'player3', name: 'Charlie', score: 0, isConnected: true, hasAnswered: false, isHost: false }
      ];

      const leaderboard = result.current.getLeaderboard(scores, players);
      
      expect(leaderboard).toEqual([
        { id: 'player2', name: 'Bob', score: 200, rank: 1 },
        { id: 'player1', name: 'Alice', score: 150, rank: 2 },
        { id: 'player3', name: 'Charlie', score: 100, rank: 3 }
      ]);
    });

    it('should handle missing players with Unknown name', () => {
      const { result } = renderHook(() => useGame(), {
        wrapper: ({ children }) => <GameProvider>{children}</GameProvider>
      });

      const scores = { player1: 150, player2: 200 };
      const players = [
        { id: 'player1', name: 'Alice', score: 0, isConnected: true, hasAnswered: false, isHost: true }
        // player2 is missing from players array
      ];

      const leaderboard = result.current.getLeaderboard(scores, players);
      
      expect(leaderboard[0].name).toBe('Unknown'); // player2
      expect(leaderboard[1].name).toBe('Alice'); // player1
    });
  });
});