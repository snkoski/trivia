import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './services/RoomManager';
import { SocketHandler } from './socket/SocketHandler';
import { ClientToServerEvents, ServerToClientEvents } from '../../packages/shared/dist';

const app = express();
const httpServer = createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Configure Socket.IO with CORS
const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize services
const roomManager = new RoomManager();
const socketHandler = new SocketHandler(io, roomManager);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    rooms: roomManager.getAllRooms().length,
    connections: io.engine.clientsCount
  });
});

// Room info endpoint (useful for debugging)
app.get('/api/rooms', (req, res) => {
  const rooms = roomManager.getAllRooms();
  res.json({
    count: rooms.length,
    rooms: rooms.map(room => ({
      code: room.code,
      players: room.players.length,
      state: room.state,
      createdAt: room.createdAt
    }))
  });
});

// Room details endpoint
app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Cleanup interval - remove empty rooms every 5 minutes
setInterval(() => {
  const removedCount = roomManager.cleanupEmptyRooms();
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} empty rooms`);
  }
}, 5 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
🎮 Trivia Game Server Running
============================
Server:     http://localhost:${PORT}
Health:     http://localhost:${PORT}/health
Rooms API:  http://localhost:${PORT}/api/rooms
WebSocket:  ws://localhost:${PORT}

Environment: ${process.env.NODE_ENV || 'development'}
CORS Origin: ${process.env.CLIENT_URL || 'http://localhost:5173'}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };