import { Question } from '../../../packages/shared/dist';

export const mockQuestions: Question[] = [
  {
    id: 1,
    question: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1
  },
  {
    id: 2,
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2
  },
  {
    id: 3,
    question: 'What color is the sky?',
    options: ['Red', 'Green', 'Blue', 'Yellow'],
    correctAnswer: 2
  },
  {
    id: 4,
    question: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
    correctAnswer: 2
  },
  {
    id: 5,
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
    correctAnswer: 3
  }
];