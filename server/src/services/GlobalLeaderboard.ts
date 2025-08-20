import { Question } from '../../../packages/shared/dist';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface GlobalLeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  roomCode: string;
  timestamp: number;
  gameDuration?: number;
}

export interface GameDefinition {
  gameId: string;
  questionIds: number[];
  questionCount: number;
  createdAt: number;
}

/**
 * Global Leaderboard Manager
 * Tracks high scores across all rooms playing the same game/question set
 * Includes file-based persistence for data recovery across server restarts
 */
export class GlobalLeaderboard {
  // Map of gameId -> sorted array of leaderboard entries
  private leaderboards: Map<string, GlobalLeaderboardEntry[]> = new Map();
  
  // Map of gameId -> game definition for reference
  private gameDefinitions: Map<string, GameDefinition> = new Map();
  
  // Maximum entries to keep per game (top N scores)
  private readonly MAX_ENTRIES_PER_GAME = 100;
  
  // File persistence settings
  private readonly DATA_DIR = path.join(process.cwd(), 'data');
  private readonly LEADERBOARD_FILE = path.join(this.DATA_DIR, 'leaderboards.json');
  private readonly GAMES_FILE = path.join(this.DATA_DIR, 'games.json');
  
  // Auto-save settings
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY_MS = 5000; // Save 5 seconds after last change
  
  constructor() {
    this.ensureDataDirectory();
    this.loadFromFiles();
  }

  /**
   * Generate a unique game ID based on the question set
   * This allows multiple rooms to play the "same game"
   */
  generateGameId(questions: Question[]): string {
    // Create hash based on question IDs and content
    const questionData = questions.map(q => `${q.id}:${q.question}:${q.correctAnswer}`).join('|');
    const hash = crypto.createHash('sha256').update(questionData).digest('hex');
    return `game_${hash.substring(0, 12)}`;
  }

  /**
   * Register a game definition (call when game starts)
   */
  registerGame(questions: Question[]): string {
    const gameId = this.generateGameId(questions);
    
    if (!this.gameDefinitions.has(gameId)) {
      const gameDefinition: GameDefinition = {
        gameId,
        questionIds: questions.map(q => q.id),
        questionCount: questions.length,
        createdAt: Date.now()
      };
      
      this.gameDefinitions.set(gameId, gameDefinition);
      console.log(`Registered new game: ${gameId} with ${questions.length} questions`);
      
      // Schedule save to file
      this.scheduleSave();
    }
    
    return gameId;
  }

  /**
   * Submit scores from a completed game to the global leaderboard
   */
  submitGameResults(
    questions: Question[],
    roomCode: string,
    playerScores: { playerId: string; playerName: string; score: number }[],
    gameDuration?: number
  ): string {
    const gameId = this.registerGame(questions);
    
    // Get or create leaderboard for this game
    if (!this.leaderboards.has(gameId)) {
      this.leaderboards.set(gameId, []);
    }
    
    const leaderboard = this.leaderboards.get(gameId)!;
    const timestamp = Date.now();
    
    // Add all player scores to the global leaderboard
    for (const player of playerScores) {
      if (player.score > 0) { // Only add players with positive scores
        const entry: GlobalLeaderboardEntry = {
          playerId: player.playerId,
          playerName: player.playerName,
          score: player.score,
          roomCode,
          timestamp,
          gameDuration
        };
        
        leaderboard.push(entry);
      }
    }
    
    // Sort by score (descending) and keep only top entries
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Primary: score descending
      }
      return a.timestamp - b.timestamp; // Secondary: earlier timestamp wins ties
    });
    
    // Trim to max entries
    if (leaderboard.length > this.MAX_ENTRIES_PER_GAME) {
      leaderboard.splice(this.MAX_ENTRIES_PER_GAME);
    }
    
    console.log(`Updated global leaderboard for game ${gameId}, now has ${leaderboard.length} entries`);
    
    // Schedule save to file
    this.scheduleSave();
    
    return gameId;
  }

  /**
   * Get the global leaderboard for a specific game
   */
  getLeaderboard(gameId: string, limit: number = 10): GlobalLeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(gameId);
    if (!leaderboard) {
      return [];
    }
    
    return leaderboard.slice(0, limit);
  }

  /**
   * Get leaderboard for the current question set
   */
  getLeaderboardForQuestions(questions: Question[], limit: number = 10): GlobalLeaderboardEntry[] {
    const gameId = this.generateGameId(questions);
    return this.getLeaderboard(gameId, limit);
  }

  /**
   * Get all available games with leaderboards
   */
  getAllGames(): GameDefinition[] {
    return Array.from(this.gameDefinitions.values())
      .sort((a, b) => b.createdAt - a.createdAt); // Most recent first
  }

  /**
   * Get a player's best score for a specific game
   */
  getPlayerBestScore(gameId: string, playerId: string): GlobalLeaderboardEntry | null {
    const leaderboard = this.leaderboards.get(gameId);
    if (!leaderboard) {
      return null;
    }
    
    // Find the player's best score (highest score)
    const playerEntries = leaderboard.filter(entry => entry.playerId === playerId);
    if (playerEntries.length === 0) {
      return null;
    }
    
    return playerEntries.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }

  /**
   * Get player's rank in the global leaderboard
   */
  getPlayerRank(gameId: string, playerId: string): number | null {
    const leaderboard = this.leaderboards.get(gameId);
    if (!leaderboard) {
      return null;
    }
    
    const playerBest = this.getPlayerBestScore(gameId, playerId);
    if (!playerBest) {
      return null;
    }
    
    // Count how many unique players have a higher score
    const uniquePlayersWithHigherScore = new Set(
      leaderboard
        .filter(entry => entry.score > playerBest.score)
        .map(entry => entry.playerId)
    );
    
    return uniquePlayersWithHigherScore.size + 1;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.leaderboards.clear();
    this.gameDefinitions.clear();
    this.scheduleSave();
  }
  
  /**
   * Ensure data directory exists
   */
  private ensureDataDirectory(): void {
    try {
      if (!fs.existsSync(this.DATA_DIR)) {
        fs.mkdirSync(this.DATA_DIR, { recursive: true });
        console.log(`Created data directory: ${this.DATA_DIR}`);
      }
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }
  
  /**
   * Load leaderboard data from files on startup
   */
  private loadFromFiles(): void {
    try {
      // Load leaderboards
      if (fs.existsSync(this.LEADERBOARD_FILE)) {
        const leaderboardData = fs.readFileSync(this.LEADERBOARD_FILE, 'utf8');
        const parsed = JSON.parse(leaderboardData);
        
        // Convert back to Map
        this.leaderboards = new Map(Object.entries(parsed));
        
        const totalScores = Array.from(this.leaderboards.values())
          .reduce((sum, entries) => sum + entries.length, 0);
        console.log(`Loaded ${this.leaderboards.size} games with ${totalScores} total scores`);
      }
      
      // Load game definitions
      if (fs.existsSync(this.GAMES_FILE)) {
        const gamesData = fs.readFileSync(this.GAMES_FILE, 'utf8');
        const parsed = JSON.parse(gamesData);
        
        // Convert back to Map
        this.gameDefinitions = new Map(Object.entries(parsed));
        console.log(`Loaded ${this.gameDefinitions.size} game definitions`);
      }
    } catch (error) {
      console.error('Failed to load leaderboard data from files:', error);
      console.log('Starting with empty leaderboards');
    }
  }
  
  /**
   * Schedule a save operation (debounced)
   */
  private scheduleSave(): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Schedule new save
    this.saveTimeout = setTimeout(() => {
      this.saveToFiles();
    }, this.SAVE_DELAY_MS);
  }
  
  /**
   * Save leaderboard data to files
   */
  private saveToFiles(): void {
    try {
      // Convert Maps to plain objects for JSON serialization
      const leaderboardObj = Object.fromEntries(this.leaderboards);
      const gamesObj = Object.fromEntries(this.gameDefinitions);
      
      // Save leaderboards
      fs.writeFileSync(this.LEADERBOARD_FILE, JSON.stringify(leaderboardObj, null, 2));
      
      // Save game definitions
      fs.writeFileSync(this.GAMES_FILE, JSON.stringify(gamesObj, null, 2));
      
      const totalScores = Array.from(this.leaderboards.values())
        .reduce((sum, entries) => sum + entries.length, 0);
      console.log(`Saved ${this.leaderboards.size} games with ${totalScores} scores to disk`);
    } catch (error) {
      console.error('Failed to save leaderboard data to files:', error);
    }
  }
  
  /**
   * Force immediate save (useful for graceful shutdown)
   */
  public forceSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveToFiles();
  }
}

// Singleton instance
export const globalLeaderboard = new GlobalLeaderboard();