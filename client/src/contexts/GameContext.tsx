import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Player } from '@trivia/shared';

interface Winner {
  id: string;
  name: string;
  score: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  rank: number;
}

interface GameContextType {
  // Question state
  questionNumber: number;
  totalQuestions: number;
  
  // Timer state
  timeRemaining: number | null;
  
  // Answer state
  selectedAnswer: number | null;
  playerAnswers: Record<string, number>;
  
  // Results state
  showResults: boolean;
  winner: Winner | null;
  isTie: boolean;
  tiedWinners?: Winner[];
  
  // Actions
  setQuestionProgress: (current: number, total: number) => void;
  resetQuestionProgress: () => void;
  incrementQuestion: () => void;
  
  setSelectedAnswer: (answer: number) => void;
  clearSelectedAnswer: () => void;
  setPlayerAnswer: (playerId: string, answer: number) => void;
  clearPlayerAnswers: () => void;
  
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  updateTimeRemaining: (time: number) => void;
  
  setShowResults: (show: boolean) => void;
  calculateWinner: (scores: Record<string, number>, players: Player[]) => void;
  
  resetGame: () => void;
  
  // Utility functions
  formatTime: (seconds: number) => string;
  getLeaderboard: (scores: Record<string, number>, players: Player[]) => LeaderboardEntry[];
  allPlayersAnswered: (players: Player[]) => boolean;
  isAnswerCorrect: (selected: number | null, correct: number | null) => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Question state
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Answer state
  const [selectedAnswer, setSelectedAnswerState] = useState<number | null>(null);
  const [playerAnswers, setPlayerAnswers] = useState<Record<string, number>>({});
  
  // Results state
  const [showResults, setShowResults] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [tiedWinners, setTiedWinners] = useState<Winner[]>([]);

  // Question management
  const setQuestionProgress = useCallback((current: number, total: number) => {
    setQuestionNumber(current);
    setTotalQuestions(total);
  }, []);

  const resetQuestionProgress = useCallback(() => {
    setQuestionNumber(0);
    setTotalQuestions(0);
  }, []);

  const incrementQuestion = useCallback(() => {
    setQuestionNumber(prev => prev + 1);
  }, []);

  // Answer management
  const setSelectedAnswer = useCallback((answer: number) => {
    setSelectedAnswerState(answer);
  }, []);

  const clearSelectedAnswer = useCallback(() => {
    setSelectedAnswerState(null);
  }, []);

  const setPlayerAnswer = useCallback((playerId: string, answer: number) => {
    setPlayerAnswers(prev => ({ ...prev, [playerId]: answer }));
  }, []);

  const clearPlayerAnswers = useCallback(() => {
    setPlayerAnswers({});
  }, []);

  // Timer management
  const startTimer = useCallback((seconds: number) => {
    setTimeRemaining(seconds);
  }, []);

  const stopTimer = useCallback(() => {
    setTimeRemaining(null);
  }, []);

  const updateTimeRemaining = useCallback((time: number) => {
    setTimeRemaining(time);
  }, []);

  // Winner calculation
  const calculateWinner = useCallback((scores: Record<string, number>, players: Player[]) => {
    if (Object.keys(scores).length === 0) {
      setWinner(null);
      setIsTie(false);
      return;
    }

    // Find the highest score
    const maxScore = Math.max(...Object.values(scores));
    
    // Find all players with the highest score
    const winners = Object.entries(scores)
      .filter(([_, score]) => score === maxScore)
      .map(([playerId, score]) => {
        const player = players.find(p => p.id === playerId);
        return {
          id: playerId,
          name: player?.name || 'Unknown',
          score
        };
      });

    if (winners.length === 1) {
      setWinner(winners[0]);
      setIsTie(false);
      setTiedWinners([]);
    } else if (winners.length > 1) {
      setWinner(null);
      setIsTie(true);
      setTiedWinners(winners);
    }
  }, []);

  // Game reset
  const resetGame = useCallback(() => {
    setQuestionNumber(0);
    setTotalQuestions(0);
    setTimeRemaining(null);
    setSelectedAnswerState(null);
    setPlayerAnswers({});
    setShowResults(false);
    setWinner(null);
    setIsTie(false);
    setTiedWinners([]);
  }, []);

  // Utility functions
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getLeaderboard = useCallback((scores: Record<string, number>, players: Player[]): LeaderboardEntry[] => {
    // Handle undefined or null scores
    if (!scores || typeof scores !== 'object') {
      return [];
    }
    
    return Object.entries(scores)
      .map(([playerId, score]) => {
        const player = players.find(p => p.id === playerId);
        return {
          id: playerId,
          name: player?.name || 'Unknown',
          score: score || 0
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }, []);

  const allPlayersAnswered = useCallback((players: Player[]): boolean => {
    return players.every(player => player.hasAnswered);
  }, []);

  const isAnswerCorrect = useCallback((selected: number | null, correct: number | null): boolean => {
    if (selected === null || correct === null) return false;
    return selected === correct;
  }, []);

  const value: GameContextType = {
    questionNumber,
    totalQuestions,
    timeRemaining,
    selectedAnswer,
    playerAnswers,
    showResults,
    winner,
    isTie,
    tiedWinners,
    setQuestionProgress,
    resetQuestionProgress,
    incrementQuestion,
    setSelectedAnswer,
    clearSelectedAnswer,
    setPlayerAnswer,
    clearPlayerAnswers,
    startTimer,
    stopTimer,
    updateTimeRemaining,
    setShowResults,
    calculateWinner,
    resetGame,
    formatTime,
    getLeaderboard,
    allPlayersAnswered,
    isAnswerCorrect
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};