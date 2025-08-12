import { Room, Player } from '../../../packages/shared/dist';

interface JoinRoomResult {
  success: boolean;
  room?: Room;
  error?: string;
}

interface LeaveRoomResult {
  success: boolean;
  error?: string;
}

export class RoomManager {
  private rooms: Map<string, Room>;
  private playerRoomMap: Map<string, string>; // playerId -> roomCode

  constructor() {
    this.rooms = new Map();
    this.playerRoomMap = new Map();
  }

  createRoom(playerId: string, playerName: string): Room {
    const roomCode = this.generateRoomCode();
    
    const host: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isConnected: true,
      hasAnswered: false,
      isHost: true
    };

    const room: Room = {
      code: roomCode,
      players: [host],
      state: 'waiting',
      currentQuestionIndex: 0,
      maxPlayers: 8,
      createdAt: new Date()
    };

    this.rooms.set(roomCode, room);
    this.playerRoomMap.set(playerId, roomCode);

    return room;
  }

  private generateRoomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (this.rooms.has(code)); // Ensure unique code

    return code;
  }

  joinRoom(roomCode: string, playerId: string, playerName: string): JoinRoomResult {
    throw new Error('Not implemented yet');
  }

  leaveRoom(roomCode: string, playerId: string): LeaveRoomResult {
    throw new Error('Not implemented yet');
  }

  getRoom(roomCode: string): Room | null {
    throw new Error('Not implemented yet');
  }

  getRoomByPlayerId(playerId: string): Room | null {
    throw new Error('Not implemented yet');
  }

  cleanupEmptyRooms(): void {
    throw new Error('Not implemented yet');
  }
}