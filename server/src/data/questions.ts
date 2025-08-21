import { Question } from '../../../packages/shared/dist';

export const mockQuestions: Question[] = [
  {
    id: 1,
    question: 'Name this song or artist:',
    audioUrl:
      'http://localhost:3001/audio/i_thought_you_didnt_even_like_leaving__prince_daddy_and_the_hyena.m4a',
    options: ['Artist A - Song A', 'Artist B - Song B', 'Artist C - Song C', 'Artist D - Song D'],
    correctAnswer: 0
  },
  {
    id: 2,
    question: 'Which song is this?',
    audioUrl: 'http://localhost:3001/audio/song2.mp3',
    options: ['Song Title 1', 'Song Title 2', 'Song Title 3', 'Song Title 4'],
    correctAnswer: 1
  },
  {
    id: 3,
    question: 'Name the artist:',
    audioUrl: 'http://localhost:3001/audio/song3.mp3',
    options: ['Artist 1', 'Artist 2', 'Artist 3', 'Artist 4'],
    correctAnswer: 2
  },
  {
    id: 4,
    question: 'What genre is this music?',
    audioUrl: 'http://localhost:3001/audio/song4.mp3',
    options: ['Pop', 'Rock', 'Hip-Hop', 'Electronic'],
    correctAnswer: 2
  },
  {
    id: 5,
    question: 'Name this track:',
    audioUrl: 'http://localhost:3001/audio/song5.mp3',
    options: ['Track A', 'Track B', 'Track C', 'Track D'],
    correctAnswer: 3
  }
];
