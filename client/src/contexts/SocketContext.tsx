import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { socketService } from '../services/socket';
import type { TypedSocket } from '../services/socket';
import type { Room, Player, ClientQuestion, GameState } from '@trivia/shared';

interface SocketContextType {
  // Connection
  socket: TypedSocket | null;
  isConnected: boolean;
  
  // Room state
  currentRoom: Room | null;
  roomCode: string | null;
  players: Player[];
  isHost: boolean;
  currentPlayerId: string | null;
  
  // Game state
  gameState: GameState;
  currentQuestion: ClientQuestion | null;
  scores: Record<string, number>;
  correctAnswer: number | null;
  hasAnswered: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  createRoom: (playerName: string) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  submitAnswer: (answerIndex: number) => void;
  requestNextQuestion: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Room state
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<ClientQuestion | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = socketService.connect();
    setSocket(newSocket);
    setIsConnected(newSocket.connected);

    // Connection state handlers
    newSocket.on('connect', () => {
      console.log('SocketContext: Connected to server');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('SocketContext: Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('SocketContext: Connection error:', error);
      setIsConnected(false);
      setError('Connection failed');
    });

    // Set up event listeners
    socketService.onRoomCreated((code) => {
      setRoomCode(code);
      setIsHost(true);
    });

    socketService.onRoomJoined((data) => {
      const { room, currentPlayerId: playerId } = data;
      setCurrentRoom(room);
      setRoomCode(room.code);
      setPlayers(room.players);
      setGameState(room.state);
      setCurrentPlayerId(playerId);
      
      // Now we can properly identify the current player using currentPlayerId
      const currentPlayer = room.players.find(p => p.id === playerId);
      if (currentPlayer) {
        // Only override isHost if this is a room join (not creation)
        if (roomCode === null) {
          setIsHost(currentPlayer.isHost);
        }
      }
    });

    socketService.onPlayerJoined((player) => {
      setPlayers(prev => [...prev, player]);
    });

    socketService.onPlayerLeft((playerId) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });

    socketService.onGameStarted((firstQuestion) => {
      setGameState('playing');
      setCurrentQuestion(firstQuestion);
      setHasAnswered(false);
      setCorrectAnswer(null);
      // Reset all players' hasAnswered status for the game start
      setPlayers(prev => prev.map(p => ({ ...p, hasAnswered: false })));
    });

    socketService.onNextQuestion((question) => {
      setCurrentQuestion(question);
      setHasAnswered(false);
      setCorrectAnswer(null);
      // Reset all players' hasAnswered status for the new question
      setPlayers(prev => prev.map(p => ({ ...p, hasAnswered: false })));
      
      // Update the room's question index when we get a new question
      setCurrentRoom(prev => {
        if (prev) {
          return {
            ...prev,
            currentQuestionIndex: (prev.currentQuestionIndex || 0) + 1
          };
        }
        return prev;
      });
    });

    socketService.onPlayerAnswered((playerId) => {
      // Update player's hasAnswered status
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, hasAnswered: true } : p
      ));
    });

    socketService.onRoundResults((newScores, answer) => {
      setScores(newScores);
      setCorrectAnswer(answer);
    });

    socketService.onGameEnded((gameEndData) => {
      setGameState('finished');
      
      // Handle both old format (just scores) and new format (object with scores and players)
      if (gameEndData && typeof gameEndData === 'object' && 'finalScores' in gameEndData) {
        // New format: { finalScores: Record<string, number>, players: Player[] }
        setScores(gameEndData.finalScores);
        setPlayers(gameEndData.players);
      } else {
        // Old format: just Record<string, number>
        setScores(gameEndData as Record<string, number>);
        // Keep existing players array as is
      }
    });

    socketService.onError((message) => {
      setError(message);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      socketService.removeAllListeners();
    };
  }, []);

  // Action methods
  const createRoom = useCallback((playerName: string) => {
    socketService.createRoom(playerName);
  }, []);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    socketService.joinRoom(roomCode, playerName);
  }, []);

  const leaveRoom = useCallback(() => {
    socketService.leaveRoom();
    setCurrentRoom(null);
    setRoomCode(null);
    setPlayers([]);
    setIsHost(false);
    setGameState('waiting');
    setCurrentQuestion(null);
    setScores({});
    setCorrectAnswer(null);
    setHasAnswered(false);
  }, []);

  const startGame = useCallback(() => {
    socketService.startGame();
  }, []);

  const submitAnswer = useCallback((answerIndex: number) => {
    socketService.submitAnswer(answerIndex);
    setHasAnswered(true);
  }, []);

  const requestNextQuestion = useCallback(() => {
    socketService.requestNextQuestion();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    currentRoom,
    roomCode,
    players,
    isHost,
    currentPlayerId,
    gameState,
    currentQuestion,
    scores,
    correctAnswer,
    hasAnswered,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
    requestNextQuestion,
    clearError
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};