export interface Question {
  id: number;
  question: string;
  audioUrl?: string;
  options: string[];
  correctAnswer: number;
}

export type GameState = 'start' | 'playing' | 'end';