import type { Question } from '../types';

export const mockQuestions: Question[] = [
  {
    id: 1,
    question: 'Name this song or artist:',
    audioUrl: '/audio/song1.mp3',
    options: [
      'The Beatles - Hey Jude',
      'The Rolling Stones - Paint It Black',
      'Led Zeppelin - Stairway to Heaven',
      'Pink Floyd - Wish You Were Here'
    ],
    correctAnswer: 0
  },
  {
    id: 2,
    question: 'Which movie is this theme from?',
    audioUrl: '/audio/song2.wav',
    options: ['Star Wars', 'Indiana Jones', 'Jurassic Park', 'Harry Potter'],
    correctAnswer: 0
  },
  {
    id: 3,
    question: 'Name the composer of this classical piece:',
    audioUrl: '/audio/song3.wav',
    options: ['Mozart', 'Beethoven', 'Bach', 'Chopin'],
    correctAnswer: 1
  },
  {
    id: 4,
    question: 'What genre best describes this music?',
    audioUrl: '/audio/song4.wav',
    options: ['Jazz', 'Blues', 'Rock', 'Classical'],
    correctAnswer: 0
  },
  {
    id: 5,
    question: 'Name this instrument:',
    audioUrl: '/audio/song5.wav',
    options: ['Violin', 'Cello', 'Viola', 'Double Bass'],
    correctAnswer: 0
  }
];