import { Question, Player, ClientQuestion } from '../../../packages/shared/dist';

interface StartGameResult {
  success: boolean;
  question?: ClientQuestion;
  error?: string;
}

interface SubmitAnswerResult {
  success: boolean;
  isCorrect?: boolean;
  pointsAwarded?: number;
  error?: string;
}

interface NextQuestionResult {
  success: boolean;
  question?: ClientQuestion | null;
  gameFinished?: boolean;
  error?: string;
}

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
}

interface EndGameResult {
  success: boolean;
  finalScores?: Record<string, number>;
  winner?: string;
  winners?: string[];
  winnerScore?: number;
  isTie?: boolean;
  duration?: number;
  startTime?: number;
  endTime?: number;
  error?: string;
}

export class GameEngine {
  private questions: Question[];
  private players: Player[];
  private currentQuestionIndex: number;
  private gameStarted: boolean;
  private gameFinished: boolean;
  private gameStartTime: number | null;
  private gameEndTime: number | null;
  private firstCorrectAnswerer: string | null; // For bonus points

  constructor(questions: Question[], players: Player[]) {
    this.questions = questions;
    this.players = players.map(p => ({ ...p })); // Copy to avoid mutations
    this.currentQuestionIndex = 0;
    this.gameStarted = false;
    this.gameFinished = false;
    this.gameStartTime = null;
    this.gameEndTime = null;
    this.firstCorrectAnswerer = null;
  }

  // Getter methods for tests
  getQuestions(): Question[] {
    return this.questions;
  }

  getPlayers(): Player[] {
    return this.players;
  }

  getCurrentQuestionIndex(): number {
    return this.currentQuestionIndex;
  }

  isStarted(): boolean {
    return this.gameStarted;
  }

  isFinished(): boolean {
    return this.gameFinished;
  }

  getStartTime(): number {
    return this.gameStartTime || 0;
  }

  getScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    this.players.forEach(player => {
      scores[player.id] = player.score;
    });
    return scores;
  }

  startGame(): StartGameResult {
    if (this.gameStarted) {
      return { success: false, error: 'Game already started' };
    }

    if (this.questions.length === 0) {
      return { success: false, error: 'No questions available' };
    }

    if (this.players.length === 0) {
      return { success: false, error: 'No players in game' };
    }

    this.gameStarted = true;
    this.gameStartTime = Date.now();
    
    return {
      success: true,
      question: this.toClientQuestion(this.questions[0])
    };
  }

  submitAnswer(playerId: string, answerIndex: number): SubmitAnswerResult {
    if (!this.gameStarted) {
      return { success: false, error: 'Game not started' };
    }

    if (this.gameFinished) {
      return { success: false, error: 'Game already finished' };
    }

    const player = this.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (player.hasAnswered) {
      return { success: false, error: 'Player already answered' };
    }

    const currentQuestion = this.questions[this.currentQuestionIndex];
    
    if (answerIndex < 0 || answerIndex >= currentQuestion.options.length) {
      return { success: false, error: 'Invalid answer index' };
    }

    // Mark player as having answered
    player.hasAnswered = true;

    // Check if answer is correct
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    let pointsAwarded = 0;

    if (isCorrect) {
      pointsAwarded = 100; // Base points

      // Award bonus for first correct answer
      if (!this.firstCorrectAnswerer) {
        this.firstCorrectAnswerer = playerId;
        pointsAwarded = 150; // Base + bonus
      }

      player.score += pointsAwarded;
    }

    return {
      success: true,
      isCorrect,
      pointsAwarded
    };
  }

  nextQuestion(): NextQuestionResult {
    if (!this.gameStarted) {
      return { success: false, error: 'Game not started' };
    }

    if (this.gameFinished) {
      return { success: false, error: 'Game already finished' };
    }

    // Reset all players' hasAnswered status
    this.players.forEach(player => {
      player.hasAnswered = false;
    });

    // Reset first correct answerer for next question
    this.firstCorrectAnswerer = null;

    // Advance to next question
    this.currentQuestionIndex++;

    // Check if game is finished
    if (this.currentQuestionIndex >= this.questions.length) {
      this.gameFinished = true;
      this.gameEndTime = Date.now();
      
      return {
        success: true,
        question: null,
        gameFinished: true
      };
    }

    return {
      success: true,
      question: this.toClientQuestion(this.questions[this.currentQuestionIndex])
    };
  }

  getCurrentQuestion(): ClientQuestion | null {
    if (!this.gameStarted || this.gameFinished) {
      return null;
    }

    return this.toClientQuestion(this.questions[this.currentQuestionIndex]);
  }

  getLeaderboard(): LeaderboardEntry[] {
    return this.players
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        score: player.score
      }))
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }

  endGame(): EndGameResult {
    if (!this.gameStarted) {
      return { success: false, error: 'Game not started' };
    }

    this.gameFinished = true;
    this.gameEndTime = Date.now();

    const finalScores = this.getScores();
    const leaderboard = this.getLeaderboard();
    
    // Find winner(s)
    const topScore = leaderboard[0]?.score || 0;
    const winners = leaderboard
      .filter(entry => entry.score === topScore)
      .map(entry => entry.playerId);

    const isTie = winners.length > 1;
    const winner = isTie ? undefined : winners[0];
    const winnerScore = topScore;

    const duration = this.gameEndTime! - this.gameStartTime!;

    return {
      success: true,
      finalScores,
      winner,
      winners,
      winnerScore,
      isTie,
      duration,
      startTime: this.gameStartTime!,
      endTime: this.gameEndTime!
    };
  }

  validateQuestions(): void {
    for (const question of this.questions) {
      if (!question.id || !question.question || !question.options || 
          typeof question.correctAnswer !== 'number') {
        throw new Error('Invalid question format');
      }
    }
  }

  // Helper method to convert Question to ClientQuestion (removes correctAnswer)
  private toClientQuestion(question: Question): ClientQuestion {
    const clientQuestion: ClientQuestion = {
      id: question.id,
      question: question.question,
      options: question.options,
      currentQuestionNumber: this.currentQuestionIndex + 1,
      totalQuestions: this.questions.length
    };

    if (question.audioUrl) {
      clientQuestion.audioUrl = question.audioUrl;
    }

    return clientQuestion;
  }
}