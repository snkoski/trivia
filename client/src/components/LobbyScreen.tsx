import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { GlobalLeaderboard } from './GlobalLeaderboard';

interface LobbyScreenProps {
  onRoomJoined?: () => void;
}

type LobbyState = 'main' | 'create' | 'join' | 'creating' | 'joining';

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onRoomJoined }) => {
  const { 
    isConnected, 
    error, 
    roomCode, 
    currentRoom, 
    createRoom, 
    joinRoom, 
    clearError 
  } = useSocket();

  const [lobbyState, setLobbyState] = useState<LobbyState>('main');
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Handle successful room creation/joining
  useEffect(() => {
    if (currentRoom && onRoomJoined) {
      onRoomJoined();
    }
  }, [currentRoom, onRoomJoined]);

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!playerName.trim()) {
      errors.playerName = 'Please enter your name';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateJoinForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!roomCodeInput.trim()) {
      errors.roomCode = 'Please enter room code';
    } else if (roomCodeInput.trim().length !== 6) {
      errors.roomCode = 'Room code must be 6 characters';
    }
    
    if (!playerName.trim()) {
      errors.playerName = 'Please enter your name';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateRoom = () => {
    if (!validateCreateForm()) return;
    
    setLobbyState('creating');
    createRoom(playerName.trim());
  };

  const handleJoinRoom = () => {
    if (!validateJoinForm()) return;
    
    setLobbyState('joining');
    joinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim());
  };

  const handleBack = () => {
    setLobbyState('main');
    setPlayerName('');
    setRoomCodeInput('');
    setValidationErrors({});
  };

  const handleRoomCodeChange = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    setRoomCodeInput(value.toUpperCase().slice(0, 6));
  };

  const renderConnectionStatus = () => (
    <div className="connection-status">
      <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '● Connected' : '○ Connecting...'}
      </span>
    </div>
  );

  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="error-banner">
        <span className="error-message">{error}</span>
        <button onClick={clearError} className="dismiss-button">
          Dismiss
        </button>
      </div>
    );
  };

  const renderMainScreen = () => (
    <div className="lobby-main">
      <h1>Welcome to Trivia Game</h1>
      {renderConnectionStatus()}
      {renderError()}
      
      <div className="lobby-options">
        <div className="option-card">
          <h2>Create New Room</h2>
          <p>Start a new trivia game and invite friends</p>
          <button 
            onClick={() => setLobbyState('create')}
            disabled={!isConnected}
            className="primary-button"
          >
            Create New Room
          </button>
        </div>
        
        <div className="option-card">
          <h2>Join Existing Room</h2>
          <p>Enter a room code to join an existing game</p>
          <button 
            onClick={() => setLobbyState('join')}
            disabled={!isConnected}
            className="primary-button"
          >
            Join Existing Room
          </button>
        </div>
        
        <div className="option-card">
          <h2>🏆 Global Leaderboard</h2>
          <p>View top scores from all players</p>
          <button 
            onClick={() => setShowLeaderboard(true)}
            disabled={!isConnected}
            className="secondary-button"
          >
            View Leaderboard
          </button>
        </div>
      </div>
      
      {showLeaderboard && (
        <GlobalLeaderboard onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  );

  const renderCreateForm = () => (
    <div className="lobby-form">
      <h2>Create New Room</h2>
      {renderError()}
      
      <div className="form-group">
        <label htmlFor="player-name">Your Name</label>
        <input
          id="player-name"
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={lobbyState === 'creating'}
          maxLength={20}
        />
        {validationErrors.playerName && (
          <span className="error-text">{validationErrors.playerName}</span>
        )}
      </div>
      
      <div className="form-actions">
        <button 
          onClick={handleBack}
          disabled={lobbyState === 'creating'}
          className="secondary-button"
        >
          Back
        </button>
        <button 
          onClick={handleCreateRoom}
          disabled={lobbyState === 'creating' || !isConnected}
          className="primary-button"
        >
          {lobbyState === 'creating' ? 'Creating room...' : 'Create Room'}
        </button>
      </div>
    </div>
  );

  const renderJoinForm = () => (
    <div className="lobby-form">
      <h2>Join Existing Room</h2>
      {renderError()}
      
      <div className="form-group">
        <label htmlFor="room-code">Room Code</label>
        <input
          id="room-code"
          type="text"
          placeholder="Enter room code"
          value={roomCodeInput}
          onChange={(e) => handleRoomCodeChange(e.target.value)}
          disabled={lobbyState === 'joining'}
          maxLength={6}
          style={{ textTransform: 'uppercase' }}
        />
        {validationErrors.roomCode && (
          <span className="error-text">{validationErrors.roomCode}</span>
        )}
      </div>
      
      <div className="form-group">
        <label htmlFor="player-name">Your Name</label>
        <input
          id="player-name"
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={lobbyState === 'joining'}
          maxLength={20}
        />
        {validationErrors.playerName && (
          <span className="error-text">{validationErrors.playerName}</span>
        )}
      </div>
      
      <div className="form-actions">
        <button 
          onClick={handleBack}
          disabled={lobbyState === 'joining'}
          className="secondary-button"
        >
          Back
        </button>
        <button 
          onClick={handleJoinRoom}
          disabled={lobbyState === 'joining' || !isConnected}
          className="primary-button"
        >
          {lobbyState === 'joining' ? 'Joining room...' : 'Join Room'}
        </button>
      </div>
    </div>
  );

  switch (lobbyState) {
    case 'create':
    case 'creating':
      return renderCreateForm();
    case 'join':
    case 'joining':
      return renderJoinForm();
    default:
      return renderMainScreen();
  }
};