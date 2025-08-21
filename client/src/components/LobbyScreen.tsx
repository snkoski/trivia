import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useUser } from '../contexts/UserContext';
import { useLobby } from '../contexts/LobbyContext';
import { GlobalLeaderboard } from './GlobalLeaderboard';
import { LobbyChat } from './LobbyChat';
import { LobbyPlayerList } from './LobbyPlayerList';

interface LobbyScreenProps {
  onRoomJoined?: () => void;
}

type LobbyState = 'username' | 'main' | 'create' | 'join' | 'creating' | 'joining';

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
  const { username, setUsername, hasUsername, clearUsername } = useUser();
  const { isInLobby, joinLobby, leaveLobby, players } = useLobby();

  const [lobbyState, setLobbyState] = useState<LobbyState>(hasUsername ? 'main' : 'username');
  const [usernameInput, setUsernameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Handle successful room creation/joining
  useEffect(() => {
    if (currentRoom && onRoomJoined) {
      onRoomJoined();
    }
  }, [currentRoom, onRoomJoined]);

  // Update lobby state when username changes
  useEffect(() => {
    setLobbyState(hasUsername ? 'main' : 'username');
  }, [hasUsername]);

  // Auto-join global lobby when username is set and connected
  useEffect(() => {
    if (hasUsername && username && !isInLobby && isConnected) {
      joinLobby(username);
    }
  }, [hasUsername, username, isInLobby, isConnected, joinLobby]);

  const validateUsernameForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!usernameInput.trim()) {
      errors.username = 'Please enter your name';
    } else if (usernameInput.trim().length > 20) {
      errors.username = 'Name must be 20 characters or less';
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
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSetUsername = () => {
    if (!validateUsernameForm()) return;
    
    setUsername(usernameInput.trim());
    setUsernameInput('');
    setValidationErrors({});
  };

  const handleCreateRoom = () => {
    if (!username) return;
    
    setLobbyState('creating');
    createRoom(username);
  };

  const handleJoinRoom = () => {
    if (!validateJoinForm() || !username) return;
    
    setLobbyState('joining');
    joinRoom(roomCodeInput.trim().toUpperCase(), username);
  };

  const handleBack = () => {
    setLobbyState('main');
    setRoomCodeInput('');
    setValidationErrors({});
  };

  const handleChangeUsername = () => {
    setUsernameInput(username || '');
    setLobbyState('username');
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

  const renderUsernameScreen = () => (
    <div className="lobby-form">
      <h2>Welcome to Trivia Game</h2>
      <p>Please enter your name to get started</p>
      {renderError()}
      
      <div className="form-group">
        <label htmlFor="username">Your Name</label>
        <input
          id="username"
          type="text"
          placeholder="Enter your name"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          maxLength={20}
          onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
        />
        {validationErrors.username && (
          <span className="error-text">{validationErrors.username}</span>
        )}
      </div>
      
      <div className="form-actions">
        <button 
          onClick={handleSetUsername}
          disabled={!isConnected}
          className="primary-button"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderMainScreen = () => (
    <div className="lobby-main">
      <div className="lobby-header">
        <h1>Trivia Game Lobby</h1>
        <div className="username-display">
          <span>Playing as: <strong>{username}</strong></span>
          <button 
            onClick={handleChangeUsername}
            className="change-username-button"
            title="Change username"
          >
            ✏️
          </button>
        </div>
        {renderConnectionStatus()}
        {renderError()}
      </div>
      
      <div className="lobby-content">
        <div className="lobby-sidebar">
          <LobbyPlayerList />
        </div>
        
        <div className="lobby-center">
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
          
          <div className="lobby-stats">
            <div className="stat-item">
              <span className="stat-value">{players.length}</span>
              <span className="stat-label">Players Online</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{isConnected ? 'Connected' : 'Connecting...'}</span>
              <span className="stat-label">Server Status</span>
            </div>
          </div>
        </div>
        
        <div className="lobby-chat-container">
          <LobbyChat />
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
      <p>Creating room as <strong>{username}</strong></p>
      {renderError()}
      
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
      <p>Joining as <strong>{username}</strong></p>
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
          onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
        />
        {validationErrors.roomCode && (
          <span className="error-text">{validationErrors.roomCode}</span>
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
    case 'username':
      return renderUsernameScreen();
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