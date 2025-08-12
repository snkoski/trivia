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
  // Methods that need to exist for tests
  createRoom(playerId: string, playerName: string): Room {
    throw new Error('Not implemented yet');
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