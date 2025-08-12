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
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: 'Room is full' };
    }

    if (room.players.some(p => p.id === playerId)) {
      return { success: false, error: 'Player already in room' };
    }

    if (room.state !== 'waiting') {
      return { success: false, error: 'Game already in progress' };
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isConnected: true,
      hasAnswered: false,
      isHost: false
    };

    room.players.push(newPlayer);
    this.playerRoomMap.set(playerId, roomCode);

    return { success: true, room };
  }

  leaveRoom(roomCode: string, playerId: string): LeaveRoomResult {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) {
      return { success: false, error: 'Player not in room' };
    }

    const leavingPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    this.playerRoomMap.delete(playerId);

    // If the leaving player was the host and there are still players
    if (leavingPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    // Delete room if empty
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
    }

    return { success: true };
  }

  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null;
  }

  getRoomByPlayerId(playerId: string): Room | null {
    const roomCode = this.playerRoomMap.get(playerId);
    if (!roomCode) return null;
    return this.getRoom(roomCode);
  }

  cleanupEmptyRooms(): void {
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.length === 0) {
        this.rooms.delete(code);
      }
    }
  }
}