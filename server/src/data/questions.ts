import { Question } from '../../../packages/shared/dist';

const getAudioUrl = (filename: string) => {
  return `https://pub-3e59ba9f7b4a44c0b35848cd99378892.r2.dev/${filename}`;
};

export const mockQuestions: Question[] = [
  {
    id: 1,
    question: 'Name this song or artist:',
    audioUrl: getAudioUrl('i_thought_you_didnt_even_like_leaving__prince_daddy_and_the_hyena.m4a'),
    options: ['Artist A - Song A', 'Artist B - Song B', 'Artist C - Song C', 'Artist D - Song D'],
    correctAnswer: 0
  },
  {
    id: 2,
    question: 'Which song is this?',
    audioUrl: getAudioUrl('song2.wav'),
    options: ['Song Title 1', 'Song Title 2', 'Song Title 3', 'Song Title 4'],
    correctAnswer: 1
  },
  {
    id: 3,
    question: 'Name the artist:',
    audioUrl: getAudioUrl('song3.wav'),
    options: ['Artist 1', 'Artist 2', 'Artist 3', 'Artist 4'],
    correctAnswer: 2
  },
  {
    id: 4,
    question: 'What genre is this music?',
    audioUrl: getAudioUrl('song4.wav'),
    options: ['Pop', 'Rock', 'Hip-Hop', 'Electronic'],
    correctAnswer: 2
  },
  {
    id: 5,
    question: 'Name this track:',
    audioUrl: getAudioUrl('song5.wav'),
    options: ['Track A', 'Track B', 'Track C', 'Track D'],
    correctAnswer: 3
  }
];
