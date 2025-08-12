// Game Types
export interface Question {
  id: number;
  question: string;
  audioUrl?: string;
  options: string[];
  correctAnswer: number;
}

export type GameState = 'waiting' | 'playing' | 'finished';

// Player Types
export interface Player {
  id: string;
  name: string;
  score: number;
  isConnected: boolean;
  hasAnswered: boolean;
  isHost: boolean;
}

// Room Types  
export interface Room {
  code: string;
  players: Player[];
  state: GameState;
  currentQuestionIndex: number;
  maxPlayers: number;
  createdAt: Date;
}

// Socket Event Types
export interface ServerToClientEvents {
  'room-created': (roomCode: string) => void;
  'room-joined': (room: Room) => void;
  'player-joined': (player: Player) => void;
  'player-left': (playerId: string) => void;
  'game-started': (firstQuestion: Question) => void;
  'next-question': (question: Question) => void;
  'player-answered': (playerId: string) => void;
  'round-results': (scores: Record<string, number>, correctAnswer: number) => void;
  'game-ended': (finalScores: Record<string, number>) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'create-room': (playerName: string) => void;
  'join-room': (roomCode: string, playerName: string) => void;
  'leave-room': () => void;
  'start-game': () => void;
  'submit-answer': (answerIndex: number) => void;
  'request-next-question': () => void;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}