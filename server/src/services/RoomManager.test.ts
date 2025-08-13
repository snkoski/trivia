import { RoomManager } from './RoomManager';
import { Room, Player } from '../../../packages/shared/dist';

describe('RoomManager', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  describe('createRoom', () => {
    it('should create a room with unique 6-character code', () => {
      const player = { id: 'player1', name: 'Alice' };
      const room = roomManager.createRoom(player.id, player.name);

      expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(room.players).toHaveLength(1);
      expect(room.players[0].id).toBe(player.id);
      expect(room.players[0].name).toBe(player.name);
      expect(room.players[0].isHost).toBe(true);
    });

    it('should generate different codes for multiple rooms', () => {
      const room1 = roomManager.createRoom('player1', 'Alice');
      const room2 = roomManager.createRoom('player2', 'Bob');

      expect(room1.code).not.toBe(room2.code);
    });

    it('should set room initial state correctly', () => {
      const room = roomManager.createRoom('player1', 'Alice');

      expect(room.state).toBe('waiting');
      expect(room.currentQuestionIndex).toBe(0);
      expect(room.maxPlayers).toBe(8);
      expect(room.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('joinRoom', () => {
    let existingRoom: Room;

    beforeEach(() => {
      existingRoom = roomManager.createRoom('host', 'Host');
    });

    it('should allow player to join existing room', () => {
      const result = roomManager.joinRoom(existingRoom.code, 'player2', 'Bob');

      expect(result.success).toBe(true);
      expect(result.room).toBeDefined();
      expect(result.room!.players).toHaveLength(2);
      expect(result.room!.players[1].name).toBe('Bob');
      expect(result.room!.players[1].isHost).toBe(false);
    });

    it('should not allow joining non-existent room', () => {
      const result = roomManager.joinRoom('INVALID', 'player2', 'Bob');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room not found');
      expect(result.room).toBeUndefined();
    });

    it('should not allow joining full room', () => {
      // Fill the room to max capacity
      for (let i = 2; i <= 8; i++) {
        roomManager.joinRoom(existingRoom.code, `player${i}`, `Player${i}`);
      }

      const result = roomManager.joinRoom(existingRoom.code, 'player9', 'Player9');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room is full');
    });

    it('should not allow same player to join twice', () => {
      roomManager.joinRoom(existingRoom.code, 'player2', 'Bob');
      const result = roomManager.joinRoom(existingRoom.code, 'player2', 'Bob');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player already in room');
    });

    it('should not allow joining room that is in progress', () => {
      existingRoom.state = 'playing';
      const result = roomManager.joinRoom(existingRoom.code, 'player2', 'Bob');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game already in progress');
    });
  });

  describe('leaveRoom', () => {
    let room: Room;

    beforeEach(() => {
      room = roomManager.createRoom('host', 'Host');
      roomManager.joinRoom(room.code, 'player2', 'Player2');
    });

    it('should remove player from room', () => {
      const result = roomManager.leaveRoom(room.code, 'player2');

      expect(result.success).toBe(true);
      expect(room.players).toHaveLength(1);
      expect(room.players.find(p => p.id === 'player2')).toBeUndefined();
    });

    it('should assign new host when host leaves', () => {
      const result = roomManager.leaveRoom(room.code, 'host');

      expect(result.success).toBe(true);
      expect(room.players[0].isHost).toBe(true);
      expect(room.players[0].id).toBe('player2');
    });

    it('should delete room when last player leaves', () => {
      roomManager.leaveRoom(room.code, 'player2');
      roomManager.leaveRoom(room.code, 'host');

      const roomAfter = roomManager.getRoom(room.code);
      expect(roomAfter).toBeNull();
    });

    it('should handle leaving non-existent room', () => {
      const result = roomManager.leaveRoom('INVALID', 'player1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room not found');
    });
  });

  describe('getRoom', () => {
    it('should return room by code', () => {
      const createdRoom = roomManager.createRoom('player1', 'Alice');
      const foundRoom = roomManager.getRoom(createdRoom.code);

      expect(foundRoom).toEqual(createdRoom);
    });

    it('should return null for non-existent room', () => {
      const room = roomManager.getRoom('INVALID');
      expect(room).toBeNull();
    });
  });

  describe('getRoomByPlayerId', () => {
    it('should find room containing player', () => {
      const room1 = roomManager.createRoom('player1', 'Alice');
      roomManager.createRoom('player2', 'Bob');
      
      const foundRoom = roomManager.getRoomByPlayerId('player1');
      
      expect(foundRoom).toEqual(room1);
    });

    it('should return null if player not in any room', () => {
      roomManager.createRoom('player1', 'Alice');
      
      const foundRoom = roomManager.getRoomByPlayerId('player2');
      
      expect(foundRoom).toBeNull();
    });
  });

  describe('cleanupEmptyRooms', () => {
    it('should remove empty rooms', () => {
      const room1 = roomManager.createRoom('player1', 'Alice');
      const room2 = roomManager.createRoom('player2', 'Bob');
      
      // Leave room1 empty
      roomManager.leaveRoom(room1.code, 'player1');
      
      roomManager.cleanupEmptyRooms();
      
      expect(roomManager.getRoom(room1.code)).toBeNull();
      expect(roomManager.getRoom(room2.code)).toBeDefined();
    });

    it('should return count of removed rooms', () => {
      const room1 = roomManager.createRoom('player1', 'Alice');
      const room2 = roomManager.createRoom('player2', 'Bob');
      const room3 = roomManager.createRoom('player3', 'Charlie');
      
      // Leave room1 and room3 empty
      roomManager.leaveRoom(room1.code, 'player1');
      roomManager.leaveRoom(room3.code, 'player3');
      
      const removedCount = roomManager.cleanupEmptyRooms();
      
      expect(removedCount).toBe(2);
    });
  });

  describe('getAllRooms', () => {
    it('should return empty array when no rooms exist', () => {
      const rooms = roomManager.getAllRooms();
      
      expect(rooms).toEqual([]);
      expect(rooms).toHaveLength(0);
    });

    it('should return all existing rooms', () => {
      const room1 = roomManager.createRoom('player1', 'Alice');
      const room2 = roomManager.createRoom('player2', 'Bob');
      const room3 = roomManager.createRoom('player3', 'Charlie');
      
      const rooms = roomManager.getAllRooms();
      
      expect(rooms).toHaveLength(3);
      expect(rooms).toContainEqual(room1);
      expect(rooms).toContainEqual(room2);
      expect(rooms).toContainEqual(room3);
    });

    it('should return current state of rooms after modifications', () => {
      const room1 = roomManager.createRoom('player1', 'Alice');
      const room2 = roomManager.createRoom('player2', 'Bob');
      
      // Join a player to room1
      roomManager.joinRoom(room1.code, 'player3', 'Charlie');
      
      // Leave room2 empty and clean it up
      roomManager.leaveRoom(room2.code, 'player2');
      roomManager.cleanupEmptyRooms();
      
      const rooms = roomManager.getAllRooms();
      
      expect(rooms).toHaveLength(1);
      expect(rooms[0].code).toBe(room1.code);
      expect(rooms[0].players).toHaveLength(2);
    });
  });
});