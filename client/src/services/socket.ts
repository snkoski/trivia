import { io, Socket } from 'socket.io-client';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents,
  Room,
  Player,
  ClientQuestion,
  LobbyPlayer,
  ChatMessage
} from '@trivia/shared';

// Create typed socket instance
export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: TypedSocket | null = null;
  private serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  connect(): TypedSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    console.log('Connecting to server:', this.serverUrl);
    
    this.socket = io(this.serverUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: true
    }) as TypedSocket;

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server with id:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  // Room operations
  createRoom(playerName: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('create-room', playerName);
  }

  joinRoom(roomCode: string, playerName: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('join-room', roomCode, playerName);
  }

  leaveRoom(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('leave-room');
  }

  // Game operations
  startGame(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('start-game');
  }

  submitAnswer(answerIndex: number): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('submit-answer', answerIndex);
  }

  requestNextQuestion(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('request-next-question');
  }

  // Lobby operations
  joinLobby(playerName: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('join-lobby', playerName);
  }

  leaveLobby(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('leave-lobby');
  }

  sendLobbyMessage(message: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('send-lobby-message', message);
  }

  // Lobby game operations
  startLobbyGame(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('start-lobby-game');
  }

  submitLobbyAnswer(answerIndex: number): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('submit-lobby-answer', answerIndex);
  }

  requestLobbyNextQuestion(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('request-lobby-next-question');
  }

  // Event listeners - to be used by React components
  onRoomCreated(callback: (roomCode: string) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('room-created', callback);
  }

  onRoomJoined(callback: (room: Room) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('room-joined', callback);
  }

  onPlayerJoined(callback: (player: Player) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('player-joined', callback);
  }

  onPlayerLeft(callback: (playerId: string) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('player-left', callback);
  }

  onGameStarted(callback: (firstQuestion: ClientQuestion) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('game-started', callback);
  }

  onNextQuestion(callback: (question: ClientQuestion) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('next-question', callback);
  }

  onPlayerAnswered(callback: (playerId: string) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('player-answered', callback);
  }

  onRoundResults(callback: (scores: Record<string, number>, correctAnswer: number) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('round-results', callback);
  }

  onGameEnded(callback: (finalScores: Record<string, number>) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('game-ended', callback);
  }

  onError(callback: (message: string) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('error', callback);
  }

  // Lobby event listeners
  onLobbyPlayersUpdated(callback: (players: LobbyPlayer[]) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-players-updated', callback);
  }

  onLobbyPlayerJoined(callback: (player: LobbyPlayer) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-player-joined', callback);
  }

  onLobbyPlayerLeft(callback: (playerId: string) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-player-left', callback);
  }

  onLobbyChatMessage(callback: (message: ChatMessage) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-chat-message', callback);
  }

  onLobbyChatHistory(callback: (messages: ChatMessage[]) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-chat-history', callback);
  }

  // Remove specific lobby listeners
  offLobbyPlayersUpdated(callback?: (players: LobbyPlayer[]) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('lobby-players-updated', callback);
    } else {
      this.socket.off('lobby-players-updated');
    }
  }

  offLobbyPlayerJoined(callback?: (player: LobbyPlayer) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('lobby-player-joined', callback);
    } else {
      this.socket.off('lobby-player-joined');
    }
  }

  offLobbyPlayerLeft(callback?: (playerId: string) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('lobby-player-left', callback);
    } else {
      this.socket.off('lobby-player-left');
    }
  }

  offLobbyChatMessage(callback?: (message: ChatMessage) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('lobby-chat-message', callback);
    } else {
      this.socket.off('lobby-chat-message');
    }
  }

  offLobbyChatHistory(callback?: (messages: ChatMessage[]) => void): void {
    if (!this.socket) return;
    if (callback) {
      this.socket.off('lobby-chat-history', callback);
    } else {
      this.socket.off('lobby-chat-history');
    }
  }

  // Lobby game event listeners
  onLobbyGameStarting(callback: (countdown: number) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-game-starting', callback);
  }

  onLobbyGameStarted(callback: (question: ClientQuestion) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-game-started', callback);
  }

  onLobbyGameNextQuestion(callback: (question: ClientQuestion) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-game-next-question', callback);
  }

  onLobbyGamePlayerAnswered(callback: (playerId: string) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-game-player-answered', callback);
  }

  onLobbyGameRoundResults(callback: (scores: Record<string, number>, correctAnswer: number) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-game-round-results', callback);
  }

  onLobbyGameEnded(callback: (finalScores: Record<string, number>) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-game-ended', callback);
  }

  onLobbyGameCancelled(callback: (reason: string) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('lobby-game-cancelled', callback);
  }

  // Clean up listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();