import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { socketService } from '../services/socket';
import { useSocket } from './SocketContext';
import type { LobbyPlayer, ChatMessage, ClientQuestion, LobbyGameState } from '@trivia/shared';

interface LobbyContextType {
  // Lobby state
  isInLobby: boolean;
  players: LobbyPlayer[];
  chatMessages: ChatMessage[];
  
  // Lobby game state
  gameState: LobbyGameState;
  currentQuestion: ClientQuestion | null;
  gameScores: Record<string, number>;
  correctAnswer: number | null;
  hasAnswered: boolean;
  countdown: number | null;
  
  // Actions
  joinLobby: (playerName: string) => void;
  leaveLobby: () => void;
  sendMessage: (message: string) => void;
  
  // Game actions
  startLobbyGame: () => void;
  submitLobbyAnswer: (answerIndex: number) => void;
  requestLobbyNextQuestion: () => void;
  resetLobbyGame: () => void;
  
  // Loading state
  isJoining: boolean;
}

const LobbyContext = createContext<LobbyContextType | null>(null);

export const useLobby = (): LobbyContextType => {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error('useLobby must be used within a LobbyProvider');
  }
  return context;
};

interface LobbyProviderProps {
  children: ReactNode;
}

export const LobbyProvider: React.FC<LobbyProviderProps> = ({ children }) => {
  const { isConnected, socket } = useSocket();
  const [isInLobby, setIsInLobby] = useState(false);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  
  // Lobby game state
  const [gameState, setGameState] = useState<LobbyGameState>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<ClientQuestion | null>(null);
  const [gameScores, setGameScores] = useState<Record<string, number>>({});
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Setup socket listeners only when connected
  useEffect(() => {
    if (!isConnected || !socket) {
      return;
    }

    // Define callbacks so we can remove them later
    const handlePlayersUpdated = (updatedPlayers: LobbyPlayer[]) => {
      setPlayers(updatedPlayers);
    };

    const handlePlayerJoined = (player: LobbyPlayer) => {
      console.log(`${player.name} joined the lobby`);
    };

    const handlePlayerLeft = (playerId: string) => {
      console.log(`Player ${playerId} left the lobby`);
    };

    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages(prev => {
        // Check if message already exists to prevent duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleChatHistory = (messages: ChatMessage[]) => {
      setChatMessages(messages);
    };

    // Lobby game handlers
    const handleLobbyGameStarting = (countdownValue: number) => {
      setGameState('starting');
      setCountdown(countdownValue);
    };

    const handleLobbyGameStarted = (question: ClientQuestion) => {
      setGameState('playing');
      setCurrentQuestion(question);
      setHasAnswered(false);
      setCorrectAnswer(null);
      setCountdown(null);
    };

    const handleLobbyGameNextQuestion = (question: ClientQuestion) => {
      setCurrentQuestion(question);
      setHasAnswered(false);
      setCorrectAnswer(null);
    };

    const handleLobbyGamePlayerAnswered = (playerId: string) => {
      console.log(`Player ${playerId} answered`);
    };

    const handleLobbyGameRoundResults = (scores: Record<string, number>, answer: number) => {
      setGameScores(scores);
      setCorrectAnswer(answer);
    };

    const handleLobbyGameEnded = (finalScores: Record<string, number>) => {
      setGameState('finished');
      setGameScores(finalScores);
      setCurrentQuestion(null);
    };

    const handleLobbyGameCancelled = (reason: string) => {
      setGameState('idle');
      setCurrentQuestion(null);
      setCountdown(null);
      console.log(`Lobby game cancelled: ${reason}`);
    };

    try {
      // Remove any existing listeners first
      socketService.offLobbyPlayersUpdated();
      socketService.offLobbyPlayerJoined();
      socketService.offLobbyPlayerLeft();
      socketService.offLobbyChatMessage();
      socketService.offLobbyChatHistory();

      // Add new listeners
      socketService.onLobbyPlayersUpdated(handlePlayersUpdated);
      socketService.onLobbyPlayerJoined(handlePlayerJoined);
      socketService.onLobbyPlayerLeft(handlePlayerLeft);
      socketService.onLobbyChatMessage(handleChatMessage);
      socketService.onLobbyChatHistory(handleChatHistory);

      // Add lobby game listeners
      socketService.onLobbyGameStarting(handleLobbyGameStarting);
      socketService.onLobbyGameStarted(handleLobbyGameStarted);
      socketService.onLobbyGameNextQuestion(handleLobbyGameNextQuestion);
      socketService.onLobbyGamePlayerAnswered(handleLobbyGamePlayerAnswered);
      socketService.onLobbyGameRoundResults(handleLobbyGameRoundResults);
      socketService.onLobbyGameEnded(handleLobbyGameEnded);
      socketService.onLobbyGameCancelled(handleLobbyGameCancelled);
    } catch (error) {
      console.error('Error setting up lobby listeners:', error);
    }

    // Cleanup function
    return () => {
      // Remove listeners
      socketService.offLobbyPlayersUpdated(handlePlayersUpdated);
      socketService.offLobbyPlayerJoined(handlePlayerJoined);
      socketService.offLobbyPlayerLeft(handlePlayerLeft);
      socketService.offLobbyChatMessage(handleChatMessage);
      socketService.offLobbyChatHistory(handleChatHistory);
      
      // Leave lobby if needed
      if (isInLobby && isConnected) {
        try {
          socketService.leaveLobby();
        } catch (error) {
          console.error('Error leaving lobby on cleanup:', error);
        }
      }
    };
  }, [isConnected, socket, isInLobby]);

  const joinLobby = useCallback((playerName: string) => {
    if (isJoining || isInLobby || !isConnected) return;
    
    setIsJoining(true);
    try {
      socketService.joinLobby(playerName);
      setIsInLobby(true);
    } catch (error) {
      console.error('Error joining lobby:', error);
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, isInLobby, isConnected]);

  const leaveLobby = useCallback(() => {
    if (!isInLobby || !isConnected) return;
    
    try {
      socketService.leaveLobby();
      setIsInLobby(false);
      setPlayers([]);
      setChatMessages([]);
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  }, [isInLobby, isConnected]);

  const sendMessage = useCallback((message: string) => {
    if (!isInLobby || !message.trim() || !isConnected) return;
    
    try {
      socketService.sendLobbyMessage(message.trim());
    } catch (error) {
      console.error('Error sending lobby message:', error);
    }
  }, [isInLobby, isConnected]);

  const startLobbyGame = useCallback(() => {
    if (!isInLobby || !isConnected || gameState !== 'idle') return;
    
    try {
      socketService.startLobbyGame();
    } catch (error) {
      console.error('Error starting lobby game:', error);
    }
  }, [isInLobby, isConnected, gameState]);

  const submitLobbyAnswer = useCallback((answerIndex: number) => {
    if (!isInLobby || !isConnected || hasAnswered || gameState !== 'playing') return;
    
    try {
      socketService.submitLobbyAnswer(answerIndex);
      setHasAnswered(true);
    } catch (error) {
      console.error('Error submitting lobby answer:', error);
    }
  }, [isInLobby, isConnected, hasAnswered, gameState]);

  const requestLobbyNextQuestion = useCallback(() => {
    if (!isInLobby || !isConnected || gameState !== 'playing') return;
    
    try {
      socketService.requestLobbyNextQuestion();
    } catch (error) {
      console.error('Error requesting next question:', error);
    }
  }, [isInLobby, isConnected, gameState]);

  const resetLobbyGame = useCallback(() => {
    setGameState('idle');
    setCurrentQuestion(null);
    setGameScores({});
    setCorrectAnswer(null);
    setHasAnswered(false);
    setCountdown(null);
  }, []);

  const value: LobbyContextType = {
    isInLobby,
    players,
    chatMessages,
    gameState,
    currentQuestion,
    gameScores,
    correctAnswer,
    hasAnswered,
    countdown,
    joinLobby,
    leaveLobby,
    sendMessage,
    startLobbyGame,
    submitLobbyAnswer,
    requestLobbyNextQuestion,
    resetLobbyGame,
    isJoining
  };

  return (
    <LobbyContext.Provider value={value}>
      {children}
    </LobbyContext.Provider>
  );
};