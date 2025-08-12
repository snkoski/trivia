import { GameEngine } from './GameEngine';
import { Question, Player } from '../../../packages/shared/dist';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockQuestions: Question[];
  let mockPlayers: Player[];

  beforeEach(() => {
    mockQuestions = [
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
      }
    ];

    mockPlayers = [
      {
        id: 'player1',
        name: 'Alice',
        score: 0,
        isConnected: true,
        hasAnswered: false,
        isHost: true
      },
      {
        id: 'player2',
        name: 'Bob',
        score: 0,
        isConnected: true,
        hasAnswered: false,
        isHost: false
      }
    ];

    gameEngine = new GameEngine(mockQuestions, mockPlayers);
  });

  describe('initialization', () => {
    it('should initialize with questions and players', () => {
      expect(gameEngine.getQuestions()).toEqual(mockQuestions);
      expect(gameEngine.getPlayers()).toEqual(mockPlayers);
    });

    it('should start at question index 0', () => {
      expect(gameEngine.getCurrentQuestionIndex()).toBe(0);
    });

    it('should initialize with game not started', () => {
      expect(gameEngine.isStarted()).toBe(false);
      expect(gameEngine.isFinished()).toBe(false);
    });

    it('should initialize all player scores to 0', () => {
      const scores = gameEngine.getScores();
      Object.values(scores).forEach((score) => {
        expect(score).toBe(0);
      });
    });

    it('should work with single player', () => {
      const singlePlayer = [mockPlayers[0]];
      const singlePlayerEngine = new GameEngine(mockQuestions, singlePlayer);

      expect(singlePlayerEngine.getPlayers()).toHaveLength(1);
      expect(singlePlayerEngine.getScores()).toHaveProperty('player1');
    });
  });

  describe('startGame', () => {
    it('should start the game and return first question', () => {
      const result = gameEngine.startGame();

      expect(result.success).toBe(true);
      expect(result.question).toEqual({
        id: mockQuestions[0].id,
        question: mockQuestions[0].question,
        options: mockQuestions[0].options
        // Note: correctAnswer is intentionally omitted for security
      });
      expect(gameEngine.isStarted()).toBe(true);
    });

    it('should not allow starting an already started game', () => {
      gameEngine.startGame();
      const result = gameEngine.startGame();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game already started');
    });

    it('should work with single player', () => {
      const singlePlayerEngine = new GameEngine(mockQuestions, [mockPlayers[0]]);
      const result = singlePlayerEngine.startGame();

      expect(result.success).toBe(true);
      expect(result.question).toEqual({
        id: mockQuestions[0].id,
        question: mockQuestions[0].question,
        options: mockQuestions[0].options
        // Note: correctAnswer is intentionally omitted for security
      });
    });

    it('should track game start time', () => {
      const beforeStart = Date.now();
      gameEngine.startGame();
      const afterStart = Date.now();

      const startTime = gameEngine.getStartTime();
      expect(startTime).toBeGreaterThanOrEqual(beforeStart);
      expect(startTime).toBeLessThanOrEqual(afterStart);
    });
  });

  describe('submitAnswer', () => {
    beforeEach(() => {
      gameEngine.startGame();
    });

    describe('valid submissions', () => {
      it('should accept correct answer and award points', () => {
        const result = gameEngine.submitAnswer('player1', 1); // Correct answer

        expect(result.success).toBe(true);
        expect(result.isCorrect).toBe(true);
        expect(result.pointsAwarded).toBe(150); // First correct gets bonus
        expect(gameEngine.getScores()['player1']).toBe(150);
      });

      it('should accept incorrect answer and award no points', () => {
        const result = gameEngine.submitAnswer('player1', 0); // Wrong answer

        expect(result.success).toBe(true);
        expect(result.isCorrect).toBe(false);
        expect(result.pointsAwarded).toBe(0);
        expect(gameEngine.getScores()['player1']).toBe(0);
      });

      it('should mark player as having answered', () => {
        gameEngine.submitAnswer('player1', 1);

        const player = gameEngine.getPlayers().find((p) => p.id === 'player1');
        expect(player?.hasAnswered).toBe(true);
      });

      it('should award bonus points for first correct answer', () => {
        const firstResult = gameEngine.submitAnswer('player1', 1); // First correct
        const secondResult = gameEngine.submitAnswer('player2', 1); // Second correct

        expect(firstResult.pointsAwarded).toBe(150); // Base + bonus
        expect(secondResult.pointsAwarded).toBe(100); // Base only
      });
    });

    describe('invalid submissions', () => {
      it('should reject answer from unknown player', () => {
        const result = gameEngine.submitAnswer('unknown', 1);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player not found');
      });

      it('should reject if player already answered current question', () => {
        gameEngine.submitAnswer('player1', 1);
        const result = gameEngine.submitAnswer('player1', 2);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player already answered');
      });

      it('should reject if game not started', () => {
        const newEngine = new GameEngine(mockQuestions, mockPlayers);
        const result = newEngine.submitAnswer('player1', 1);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Game not started');
      });

      it('should reject if game finished', () => {
        // Answer all questions to finish game
        gameEngine.submitAnswer('player1', 1);
        gameEngine.nextQuestion();
        gameEngine.submitAnswer('player1', 2);
        gameEngine.nextQuestion();
        gameEngine.submitAnswer('player1', 2);
        gameEngine.nextQuestion(); // This should end the game

        const result = gameEngine.submitAnswer('player1', 0);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Game already finished');
      });

      it('should reject invalid answer index', () => {
        const result = gameEngine.submitAnswer('player1', 10); // Out of bounds

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid answer index');
      });
    });
  });

  describe('nextQuestion', () => {
    beforeEach(() => {
      gameEngine.startGame();
    });

    it('should advance to next question', () => {
      expect(gameEngine.getCurrentQuestionIndex()).toBe(0);

      const result = gameEngine.nextQuestion();

      expect(result.success).toBe(true);
      expect(result.question).toEqual({
        id: mockQuestions[1].id,
        question: mockQuestions[1].question,
        options: mockQuestions[1].options
        // Note: correctAnswer is intentionally omitted for security
      });
      expect(gameEngine.getCurrentQuestionIndex()).toBe(1);
    });

    it('should reset all players hasAnswered status', () => {
      // Have all players answer
      gameEngine.submitAnswer('player1', 1);
      gameEngine.submitAnswer('player2', 1);

      // All should have answered
      expect(gameEngine.getPlayers().find((p) => p.id === 'player1')?.hasAnswered).toBe(true);
      expect(gameEngine.getPlayers().find((p) => p.id === 'player2')?.hasAnswered).toBe(true);

      // Move to next question
      gameEngine.nextQuestion();

      // All should be reset
      gameEngine.getPlayers().forEach((p) => {
        expect(p.hasAnswered).toBe(false);
      });
    });

    it('should finish game after last question', () => {
      // Move through all questions
      gameEngine.nextQuestion(); // To question 2
      gameEngine.nextQuestion(); // To question 3
      const result = gameEngine.nextQuestion(); // Past last question

      expect(result.success).toBe(true);
      expect(result.question).toBeNull();
      expect(result.gameFinished).toBe(true);
      expect(gameEngine.isFinished()).toBe(true);
    });

    it('should not advance if game not started', () => {
      const newEngine = new GameEngine(mockQuestions, mockPlayers);
      const result = newEngine.nextQuestion();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not started');
    });

    it('should not advance if already finished', () => {
      // Finish the game
      gameEngine.nextQuestion();
      gameEngine.nextQuestion();
      gameEngine.nextQuestion(); // Finish

      const result = gameEngine.nextQuestion();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game already finished');
    });
  });

  describe('getCurrentQuestion', () => {
    it('should return null if game not started', () => {
      const question = gameEngine.getCurrentQuestion();
      expect(question).toBeNull();
    });

    it('should return current question without correct answer', () => {
      gameEngine.startGame();
      const question = gameEngine.getCurrentQuestion();

      expect(question).toBeDefined();
      expect(question?.id).toBe(mockQuestions[0].id);
      expect(question?.question).toBe(mockQuestions[0].question);
      expect(question?.options).toEqual(mockQuestions[0].options);
      expect(question).not.toHaveProperty('correctAnswer');
    });

    it('should return null if game finished', () => {
      gameEngine.startGame();
      gameEngine.nextQuestion();
      gameEngine.nextQuestion();
      gameEngine.nextQuestion(); // Finish

      const question = gameEngine.getCurrentQuestion();
      expect(question).toBeNull();
    });
  });

  describe('getScores', () => {
    beforeEach(() => {
      gameEngine.startGame();
    });

    it('should return scores for all players', () => {
      const scores = gameEngine.getScores();

      expect(scores).toHaveProperty('player1');
      expect(scores).toHaveProperty('player2');
    });

    it('should update scores after correct answers', () => {
      gameEngine.submitAnswer('player1', 1); // Correct
      gameEngine.submitAnswer('player2', 0); // Wrong

      const scores = gameEngine.getScores();

      expect(scores['player1']).toBeGreaterThan(0);
      expect(scores['player2']).toBe(0);
    });

    it('should accumulate scores across questions', () => {
      gameEngine.submitAnswer('player1', 1); // Correct (150 - first correct)
      gameEngine.nextQuestion();
      gameEngine.submitAnswer('player1', 2); // Correct (150 - first correct of next question)

      const scores = gameEngine.getScores();

      expect(scores['player1']).toBe(300); // Two first-correct answers
    });
  });

  describe('getLeaderboard', () => {
    beforeEach(() => {
      gameEngine.startGame();
    });

    it('should return players sorted by score', () => {
      gameEngine.submitAnswer('player2', 1); // Bob correct first (150 points)
      gameEngine.submitAnswer('player1', 1); // Alice correct second (100 points)

      const leaderboard = gameEngine.getLeaderboard();

      expect(leaderboard[0].playerId).toBe('player2');
      expect(leaderboard[0].score).toBe(150);
      expect(leaderboard[1].playerId).toBe('player1');
      expect(leaderboard[1].score).toBe(100);
    });

    it('should handle tied scores with stable sort', () => {
      gameEngine.submitAnswer('player1', 0); // Wrong
      gameEngine.submitAnswer('player2', 0); // Wrong

      const leaderboard = gameEngine.getLeaderboard();

      // Both have 0 points, should maintain original order
      expect(leaderboard[0].score).toBe(0);
      expect(leaderboard[1].score).toBe(0);
    });
  });

  describe('endGame', () => {
    beforeEach(() => {
      gameEngine.startGame();
    });

    it('should mark game as finished', () => {
      const result = gameEngine.endGame();

      expect(result.success).toBe(true);
      expect(gameEngine.isFinished()).toBe(true);
    });

    it('should return final scores and winner', () => {
      gameEngine.submitAnswer('player1', 1); // Correct
      gameEngine.submitAnswer('player2', 0); // Wrong

      const result = gameEngine.endGame();

      expect(result.finalScores).toBeDefined();
      expect(result.winner).toBe('player1');
      expect(result.winnerScore).toBe(150);
    });

    it('should handle tied winners', () => {
      gameEngine.submitAnswer('player1', 1); // Correct
      gameEngine.nextQuestion();
      gameEngine.submitAnswer('player2', 2); // Correct

      const result = gameEngine.endGame();

      expect(result.winners).toContain('player1');
      expect(result.winners).toContain('player2');
      expect(result.isTie).toBe(true);
    });

    it('should calculate game duration', async () => {
      // Add a small delay to ensure measurable duration
      await new Promise((resolve) => setTimeout(resolve, 0));

      const result = gameEngine.endGame();

      expect(result.duration).toBeGreaterThanOrEqual(0); // Allow 0 for very fast execution
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.endTime!).toBeGreaterThanOrEqual(result.startTime!);
    });

    it('should not allow ending an unstarted game', () => {
      const newEngine = new GameEngine(mockQuestions, mockPlayers);
      const result = newEngine.endGame();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not started');
    });
  });

  describe('edge cases', () => {
    it('should handle empty questions array', () => {
      const emptyEngine = new GameEngine([], mockPlayers);
      const result = emptyEngine.startGame();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No questions available');
    });

    it('should handle no players', () => {
      const noPlayersEngine = new GameEngine(mockQuestions, []);
      const result = noPlayersEngine.startGame();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No players in game');
    });

    it('should validate question has required fields', () => {
      const badQuestion = { id: 1 } as Question; // Missing required fields
      const engineWithBadQuestion = new GameEngine([badQuestion], mockPlayers);

      expect(() => engineWithBadQuestion.validateQuestions()).toThrow('Invalid question format');
    });
  });
});
