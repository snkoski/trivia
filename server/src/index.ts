import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { RoomManager } from './services/RoomManager';
import { SocketHandler } from './socket/SocketHandler';
import { globalLeaderboard } from './services/GlobalLeaderboard';
import { mockQuestions } from './data/questions';
import { ClientToServerEvents, ServerToClientEvents } from '../../packages/shared/dist';

const app = express();
const httpServer = createServer(app);

// Configure CORS for Express
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Serve static audio files from client's public directory
app.use('/audio', express.static(path.join(__dirname, '../../client/public/audio')));

// Serve client build files in production
const clientDistPath = path.join(__dirname, '../../client/dist');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Client dist path:', clientDistPath);

if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
  app.use(express.static(clientDistPath));
  
  // Handle client-side routing - serve index.html for non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.startsWith('/audio/')) {
      return res.status(404).json({ error: 'Route not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

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

// Test Socket.IO is working
console.log('Socket.IO server initialized:', !!io);
console.log('HTTP server created:', !!httpServer);

// Initialize services
const roomManager = new RoomManager();
const socketHandler = new SocketHandler(io, roomManager);

// Debug Socket.IO connection
io.on('connection', (socket) => {
  console.log('DEBUG: Socket.IO connection established:', socket.id);
});

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

// Global Leaderboard API Endpoints

// Get global leaderboard for current question set
app.get('/api/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const leaderboard = globalLeaderboard.getLeaderboardForQuestions(mockQuestions, limit);
  const gameId = globalLeaderboard.generateGameId(mockQuestions);
  
  res.json({
    gameId,
    questionCount: mockQuestions.length,
    leaderboard,
    total: leaderboard.length
  });
});

// Get all available games
app.get('/api/leaderboard/games', (req, res) => {
  const games = globalLeaderboard.getAllGames();
  res.json({ games });
});

// Get leaderboard for specific game
app.get('/api/leaderboard/games/:gameId', (req, res) => {
  const { gameId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;
  const leaderboard = globalLeaderboard.getLeaderboard(gameId, limit);
  
  if (leaderboard.length === 0) {
    return res.status(404).json({ error: 'Game not found or no scores available' });
  }
  
  res.json({
    gameId,
    leaderboard,
    total: leaderboard.length
  });
});

// Get player's rank and best score for current game
app.get('/api/leaderboard/player/:playerId', (req, res) => {
  const { playerId } = req.params;
  const gameId = globalLeaderboard.generateGameId(mockQuestions);
  
  const bestScore = globalLeaderboard.getPlayerBestScore(gameId, playerId);
  const rank = globalLeaderboard.getPlayerRank(gameId, playerId);
  
  if (!bestScore) {
    return res.status(404).json({ error: 'Player not found in leaderboard' });
  }
  
  res.json({
    gameId,
    playerId,
    bestScore,
    rank,
    totalPlayers: globalLeaderboard.getLeaderboard(gameId, 1000).length
  });
});

// Reset/clear all leaderboard data
app.delete('/api/leaderboard/reset', (req, res) => {
  try {
    globalLeaderboard.clear();
    console.log('Global leaderboard has been reset');
    res.json({ 
      success: true, 
      message: 'Leaderboard has been reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset leaderboard' 
    });
  }
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
const PORT = Number(process.env.PORT) || 3001;

httpServer.listen(PORT, '0.0.0.0', () => {
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
  console.log('Saving leaderboard data...');
  globalLeaderboard.forceSave();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  console.log('Saving leaderboard data...');
  globalLeaderboard.forceSave();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };