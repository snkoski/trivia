import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Player } from '@trivia/shared';

interface WaitingRoomProps {
  onGameStart?: () => void;
  onLeaveRoom?: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ onGameStart, onLeaveRoom }) => {
  const { 
    isConnected,
    error,
    roomCode,
    currentRoom,
    players,
    isHost,
    gameState,
    startGame,
    leaveRoom,
    currentPlayerId
  } = useSocket();

  const [copyFeedback, setCopyFeedback] = useState<string>('');

  // Handle game state changes
  useEffect(() => {
    if (gameState === 'playing' && onGameStart) {
      onGameStart();
    }
  }, [gameState, onGameStart]);

  const handleStartGame = () => {
    if (canStartGame()) {
      startGame();
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

  const handleCopyRoomCode = async () => {
    if (roomCode && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopyFeedback('Copied!');
        setTimeout(() => setCopyFeedback(''), 2000);
      } catch (err) {
        setCopyFeedback('Failed to copy');
        setTimeout(() => setCopyFeedback(''), 2000);
      }
    }
  };

  const canStartGame = (): boolean => {
    return players.length >= 1 && isHost && isConnected; // Allow single player for testing
  };

  const getMinimumPlayersMessage = (): string => {
    const minPlayers = 1; // Allow single player for testing
    return `Need at least ${minPlayers} players to start`;
  };

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <div className="connection-banner warning">
          <span>⚠️ Reconnecting...</span>
        </div>
      );
    }
    return null;
  };

  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-banner">
        <span className="error-message">{error}</span>
      </div>
    );
  };

  const renderRoomInfo = () => {
    // Get current player's name using currentPlayerId
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const currentPlayerName = currentPlayer?.name || 'Unknown';
    
    return (
      <div className="room-info">
        <div className="room-header">
          <h1>Waiting Room</h1>
          <div className="current-player-info">
            <span className="current-player-label">You are:</span>
            <span className="current-player-name">{currentPlayerName}</span>
            {isHost && <span className="host-indicator">(Host)</span>}
          </div>
        <div className="room-code-container">
          <span className="room-code-label">Room Code:</span>
          <span className="room-code">{roomCode}</span>
          <button 
            onClick={handleCopyRoomCode}
            className="copy-button"
            title="Copy room code"
          >
            {copyFeedback || 'Copy'}
          </button>
        </div>
      </div>
      
      <div className="room-stats">
        <span className="player-count">
          {players.length} / {currentRoom?.maxPlayers || 8} Players
        </span>
        <span className="room-status">
          {gameState === 'waiting' ? 'Waiting for players' : 'Game in progress'}
        </span>
      </div>
    </div>
    );
  };

  const renderPlayerList = () => {
    if (players.length <= 1) {
      return (
        <div className="players-empty">
          <p>Share the room code with friends to get started!</p>
        </div>
      );
    }

    return (
      <div className="players-list">
        <h3>Players ({players.length})</h3>
        <div className="players-grid">
          {players.map((player: Player) => (
            <div key={player.id} className={`player-card ${player.isHost ? 'host' : ''}`}>
              <div className="player-info">
                <span className="player-name">{player.name}</span>
                {player.isHost && <span className="host-badge">Host</span>}
              </div>
              <div className="player-status">
                <span className={`connection-status ${player.isConnected ? 'connected' : 'disconnected'}`}>
                  {player.isConnected ? '● Connected' : '○ Disconnected'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGameControls = () => {
    if (isHost) {
      return (
        <div className="game-controls">
          <div className="start-game-section">
            {players.length < 1 && (
              <p className="minimum-players-message">
                {getMinimumPlayersMessage()}
              </p>
            )}
            <button
              onClick={handleStartGame}
              disabled={!canStartGame()}
              className="start-game-button primary-button"
            >
              Start Game
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="game-controls">
          <p className="waiting-message">
            Waiting for host to start the game...
          </p>
        </div>
      );
    }
  };

  const renderRoomActions = () => (
    <div className="room-actions">
      <button
        onClick={handleLeaveRoom}
        className="leave-room-button secondary-button"
      >
        Leave Room
      </button>
    </div>
  );

  return (
    <div className="waiting-room">
      {renderConnectionStatus()}
      {renderError()}
      {renderRoomInfo()}
      {renderPlayerList()}
      {renderGameControls()}
      {renderRoomActions()}
    </div>
  );
};