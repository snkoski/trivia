import { LobbyPlayer, ChatMessage } from '../../../packages/shared/dist';

export class GlobalLobby {
  private players: Map<string, LobbyPlayer> = new Map();
  private chatMessages: ChatMessage[] = [];
  private readonly MAX_CHAT_HISTORY = 100;

  // Player management
  addPlayer(playerId: string, playerName: string): LobbyPlayer {
    const player: LobbyPlayer = {
      id: playerId,
      name: playerName,
      isConnected: true,
      joinedAt: new Date()
    };
    
    this.players.set(playerId, player);
    
    // Add system message
    this.addSystemMessage(`${playerName} joined the lobby`);
    
    return player;
  }

  removePlayer(playerId: string): LobbyPlayer | null {
    const player = this.players.get(playerId);
    if (player) {
      this.players.delete(playerId);
      this.addSystemMessage(`${player.name} left the lobby`);
      return player;
    }
    return null;
  }

  updatePlayerStatus(playerId: string, isConnected: boolean): void {
    const player = this.players.get(playerId);
    if (player) {
      player.isConnected = isConnected;
    }
  }

  getPlayer(playerId: string): LobbyPlayer | undefined {
    return this.players.get(playerId);
  }

  getAllPlayers(): LobbyPlayer[] {
    return Array.from(this.players.values()).sort((a, b) => 
      a.joinedAt.getTime() - b.joinedAt.getTime()
    );
  }

  getConnectedPlayers(): LobbyPlayer[] {
    return this.getAllPlayers().filter(player => player.isConnected);
  }

  // Chat management
  addMessage(playerId: string, messageText: string): ChatMessage {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found in lobby');
    }

    const message: ChatMessage = {
      id: this.generateMessageId(),
      playerId,
      playerName: player.name,
      message: messageText.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    this.chatMessages.push(message);
    this.trimChatHistory();
    
    return message;
  }

  addSystemMessage(messageText: string): ChatMessage {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      playerId: 'system',
      playerName: 'System',
      message: messageText,
      timestamp: new Date(),
      type: 'system'
    };

    this.chatMessages.push(message);
    this.trimChatHistory();
    
    return message;
  }

  getChatHistory(): ChatMessage[] {
    return [...this.chatMessages];
  }

  getRecentChatHistory(limit: number = 50): ChatMessage[] {
    return this.chatMessages.slice(-limit);
  }

  // Helper methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trimChatHistory(): void {
    if (this.chatMessages.length > this.MAX_CHAT_HISTORY) {
      this.chatMessages = this.chatMessages.slice(-this.MAX_CHAT_HISTORY);
    }
  }

  // Stats
  getStats() {
    return {
      totalPlayers: this.players.size,
      connectedPlayers: this.getConnectedPlayers().length,
      totalMessages: this.chatMessages.length
    };
  }
}

// Singleton instance
export const globalLobby = new GlobalLobby();