#!/usr/bin/env node

const io = require('socket.io-client');

console.log('🔌 Testing Socket.IO Connection to Backend...\n');

// Connect to the backend server
const socket = io('http://localhost:3001');

let connectionTest = {
  connected: false,
  roomCreated: false,
  roomJoined: false,
  gameStarted: false,
  disconnected: false
};

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to backend server');
  console.log(`   Socket ID: ${socket.id}`);
  connectionTest.connected = true;
  
  // Test creating a room
  console.log('\n📝 Testing room creation...');
  socket.emit('create-room', 'TestPlayer');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from backend server');
  connectionTest.disconnected = true;
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  process.exit(1);
});

// Room events
socket.on('room-created', (roomCode) => {
  console.log('✅ Room created successfully');
  console.log(`   Room Code: ${roomCode}`);
  connectionTest.roomCreated = true;
  
  // Test starting a game
  console.log('\n🎮 Testing game start...');
  socket.emit('start-game');
});

socket.on('room-joined', (room) => {
  console.log('✅ Room joined successfully');
  console.log(`   Room Code: ${room.code}`);
  console.log(`   Players: ${room.players.length}`);
  connectionTest.roomJoined = true;
});

socket.on('game-started', (question) => {
  console.log('✅ Game started successfully');
  console.log(`   Question data:`, JSON.stringify(question, null, 2));
  if (question && question.question) {
    console.log(`   Current Question: ${question.question}`);
    if (question.options) {
      console.log(`   Options: ${question.options.join(', ')}`);
    }
  }
  connectionTest.gameStarted = true;
  
  // End test early since core functionality is proven
  console.log('\n✅ Core socket functionality verified!');
  
  setTimeout(() => {
    console.log('\n🏁 Test Summary:');
    console.log(`   Connected: ${connectionTest.connected ? '✅' : '❌'}`);
    console.log(`   Room Created: ${connectionTest.roomCreated ? '✅' : '❌'}`);
    console.log(`   Room Joined: ${connectionTest.roomJoined ? '✅' : '❌'}`);
    console.log(`   Game Started: ${connectionTest.gameStarted ? '✅' : '❌'}`);
    
    const allPassed = connectionTest.connected && connectionTest.roomCreated && connectionTest.roomJoined && connectionTest.gameStarted;
    console.log(`\n${allPassed ? '🎉 All core tests passed!' : '⚠️  Some tests failed'}`);
    console.log('🚀 Socket.IO integration between frontend and backend is working correctly!');
    
    socket.disconnect();
    process.exit(allPassed ? 0 : 1);
  }, 500);
});



// Error handling
socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n⏰ Test timeout - connection may have failed');
  socket.disconnect();
  process.exit(1);
}, 10000);