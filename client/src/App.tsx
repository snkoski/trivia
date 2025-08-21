import React, { useState, useEffect } from 'react';
import './App.css';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import { UserProvider } from './contexts/UserContext';
import { LobbyProvider } from './contexts/LobbyContext';
import { LobbyScreen } from './components/LobbyScreen';
import { WaitingRoom } from './components/WaitingRoom';
import { GameScreen } from './components/GameScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { useSocket } from './contexts/SocketContext';

type AppState = 'lobby' | 'waiting' | 'playing' | 'finished';

const AppContent: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('lobby');
  const { roomCode, gameState, isConnected } = useSocket();

  // Sync app state with socket game state
  useEffect(() => {
    if (!roomCode) {
      setAppState('lobby');
    } else if (gameState === 'waiting') {
      setAppState('waiting');
    } else if (gameState === 'playing') {
      setAppState('playing');
    } else if (gameState === 'finished') {
      setAppState('finished');
    }
  }, [roomCode, gameState]);

  const handleRoomJoined = () => {
    setAppState('waiting');
  };

  const handleGameStart = () => {
    setAppState('playing');
  };

  const handleGameEnd = () => {
    setAppState('finished');
  };

  const handleLeaveRoom = () => {
    setAppState('lobby');
  };

  const handleNewGame = () => {
    setAppState('waiting');
  };

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="connection-status disconnected">
          <span>⚠️ Connecting to server...</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app">
      <div className="game-container">
        <header className="app-header">
          <h1 className="game-title">Music Trivia Game</h1>
          {renderConnectionStatus()}
        </header>

        <main className="app-main">
          {appState === 'lobby' && (
            <LobbyScreen onRoomJoined={handleRoomJoined} />
          )}

          {appState === 'waiting' && (
            <WaitingRoom 
              onGameStart={handleGameStart}
              onLeaveRoom={handleLeaveRoom}
            />
          )}

          {appState === 'playing' && (
            <GameScreen onGameEnd={handleGameEnd} />
          )}

          {appState === 'finished' && (
            <ResultsScreen 
              onNewGame={handleNewGame}
              onLeaveRoom={handleLeaveRoom}
            />
          )}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <LobbyProvider>
          <GameProvider>
            <AppContent />
          </GameProvider>
        </LobbyProvider>
      </SocketProvider>
    </UserProvider>
  );
}

export default App;