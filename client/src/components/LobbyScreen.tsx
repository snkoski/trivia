import React, { useState, useEffect, useRef } from 'react';
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
    currentRoom, 
    createRoom, 
    joinRoom, 
    clearError 
  } = useSocket();
  const { username, setUsername, hasUsername } = useUser();
  const { 
    isInLobby, 
    joinLobby, 
    leaveLobby, 
    players, 
    gameState, 
    currentQuestion, 
    gameScores, 
    correctAnswer, 
    hasAnswered, 
    selectedAnswer,
    countdown,
    playerVotes,
    startLobbyGame, 
    submitLobbyAnswer, 
    requestLobbyNextQuestion,
    resetLobbyGame 
  } = useLobby();

  const [lobbyState, setLobbyState] = useState<LobbyState>(hasUsername ? 'main' : 'username');
  const [usernameInput, setUsernameInput] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [spiritAnimalInput, setSpiritAnimalInput] = useState('');
  const [superheroNameInput, setSuperheroNameInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Timer state for lobby game
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio ref for auto-play
  const audioRef = useRef<HTMLAudioElement>(null);
  

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

  // Start timer when new question arrives in lobby game
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset timer state when question changes or game state changes
    if (gameState === 'playing' && currentQuestion) {
      setIsTimeExpired(false);
      setTimeRemaining(35);
      
      let timeLeft = 35;
      timerRef.current = setInterval(() => {
        timeLeft -= 1;
        setTimeRemaining(timeLeft);
        
        if (timeLeft <= 0) {
          setIsTimeExpired(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // In lobby games, we should auto-proceed when everyone's time expires
          // This is handled server-side
        }
      }, 1000);
    } else {
      setTimeRemaining(null);
      setIsTimeExpired(false);
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentQuestion, gameState]);

  // Set audio source when question changes (no auto-play)
  useEffect(() => {
    if (gameState === 'playing' && currentQuestion?.audioUrl && audioRef.current) {
      audioRef.current.src = currentQuestion.audioUrl;
      // No auto-play - user must manually start audio
    }
  }, [currentQuestion?.audioUrl, gameState]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    
    const newUsername = usernameInput.trim();
    const isChangingUsername = username && username !== newUsername;
    
    // If user is already in lobby and changing username, leave first
    if (isChangingUsername && isInLobby) {
      leaveLobby();
    }
    
    setUsername(newUsername);
    setUsernameInput('');
    setValidationErrors({});
    
    // If this was a username change (not initial setup), go back to main screen
    if (username) {
      setLobbyState('main');
    }
    
    // The useEffect will handle rejoining the lobby with the new username
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
      <h2>{username ? 'Change Username' : 'Welcome to Trivia Game'}</h2>
      <p>{username ? 'Enter your new username' : 'Please enter your name to get started'}</p>
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

      <div className="form-group">
        <label htmlFor="spirit-animal">Spirit Animal</label>
        <input
          id="spirit-animal"
          type="text"
          placeholder="What's your spirit animal?"
          value={spiritAnimalInput}
          onChange={(e) => setSpiritAnimalInput(e.target.value)}
          maxLength={30}
        />
      </div>

      <div className="form-group">
        <label htmlFor="superhero-name">Superhero Name</label>
        <input
          id="superhero-name"
          type="text"
          placeholder="Your superhero alter ego"
          value={superheroNameInput}
          onChange={(e) => setSuperheroNameInput(e.target.value)}
          maxLength={30}
        />
      </div>
      
      <div className="form-actions">
        <button 
          onClick={handleSetUsername}
          disabled={!isConnected}
          className="primary-button"
        >
          {username ? 'Update Username' : 'Continue'}
        </button>
        {username && (
          <button 
            onClick={() => {
              setUsernameInput('');
              setSpiritAnimalInput('');
              setSuperheroNameInput('');
              setValidationErrors({});
              setLobbyState('main');
            }}
            className="secondary-button"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const renderVotingStatus = () => {
    if (gameState !== 'playing' || !currentQuestion) return null;

    // Sort votes by response time
    const sortedVotes = [...playerVotes].sort((a, b) => a.responseTime - b.responseTime);

    return (
      <div className="voting-status">
        <h3>Live Voting</h3>
        <div className="votes-list">
          {sortedVotes.map((vote, index) => {
            const optionText = currentQuestion.options[vote.answer];
            const isCorrect = correctAnswer !== null && vote.answer === correctAnswer;
            
            return (
              <div key={vote.playerId} className={`vote-item ${isCorrect && correctAnswer !== null ? 'correct-vote' : ''}`}>
                <div className="vote-rank">#{index + 1}</div>
                <div className="vote-player">{vote.playerName}</div>
                <div className="vote-time">{formatResponseTime(vote.responseTime)}</div>
                <div className="vote-answer">
                  {correctAnswer !== null ? (
                    <span className={isCorrect ? 'correct' : 'incorrect'}>
                      {optionText} {isCorrect ? '✓' : '✗'}
                    </span>
                  ) : (
                    <span>Voted</span>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Show players who haven't voted yet */}
          {players
            .filter(player => !playerVotes.find(vote => vote.playerId === player.id))
            .map(player => (
              <div key={player.id} className="vote-item pending">
                <div className="vote-rank">-</div>
                <div className="vote-player">{player.name}</div>
                <div className="vote-time">Thinking...</div>
                <div className="vote-answer">⏳</div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderCompactPlayerList = () => {
    if (gameState === 'idle') return null;
    
    return (
      <div className="compact-player-list">
        <h3>Players ({players.length})</h3>
        <div className="compact-players">
          {players.map(player => {
            const score = gameScores[player.id] || 0;
            const hasVoted = playerVotes.some(vote => vote.playerId === player.id);
            
            return (
              <div key={player.id} className={`compact-player ${hasVoted ? 'voted' : 'pending'}`}>
                <span className="player-name">{player.name}</span>
                <span className="player-score">{score}</span>
                {gameState === 'playing' && (
                  <span className="vote-status">{hasVoted ? '✓' : '⏳'}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLobbyGameContent = () => {
    if (gameState === 'starting' && countdown !== null) {
      return (
        <div className="lobby-game-starting">
          <h2>🎮 Big Game Starting!</h2>
          <div className="countdown-display">
            <span className="countdown-number">{countdown}</span>
          </div>
          <p>Get ready to play with {players.length} players!</p>
        </div>
      );
    }

    if (gameState === 'playing' && currentQuestion) {
      return (
        <div className="lobby-game-playing">
          <div className="question-section">
            <div className="question-header">
              <h3>Question {currentQuestion.currentQuestionNumber || 1} of {currentQuestion.totalQuestions || '?'}</h3>
              {timeRemaining !== null && (
                <div className={`timer ${timeRemaining <= 10 ? 'timer-warning' : ''} ${isTimeExpired ? 'timer-expired' : ''}`}>
                  {isTimeExpired ? 'Time\'s Up!' : formatTime(timeRemaining)}
                </div>
              )}
            </div>
            <div className="question-text">{currentQuestion.question}</div>
            {currentQuestion.audioUrl && (
              <div className="lobby-audio-section">
                <audio 
                  ref={audioRef}
                  controls 
                  src={currentQuestion.audioUrl}
                  preload="auto"
                />
                {correctAnswer !== null && (
                  <button onClick={requestLobbyNextQuestion} className="lobby-next-button primary-button">
                    Next Question
                  </button>
                )}
              </div>
            )}
            <div className="answer-options">
              {currentQuestion.options.map((option, index) => {
                let buttonClass = 'answer-button';
                
                if (hasAnswered) {
                  buttonClass += ' answered';
                  
                  // Show which answer the user selected
                  if (selectedAnswer === index) {
                    buttonClass += ' selected';
                  }
                  
                  // Show correct/incorrect after round results
                  if (correctAnswer !== null) {
                    if (correctAnswer === index) {
                      buttonClass += ' correct';
                    } else if (selectedAnswer === index && correctAnswer !== index) {
                      buttonClass += ' incorrect';
                    }
                  }
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => !isTimeExpired && submitLobbyAnswer(index)}
                    disabled={hasAnswered || isTimeExpired}
                    className={buttonClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {hasAnswered && (
              <div className="waiting-message">
                <p>Waiting for other players to answer...</p>
              </div>
            )}
            {isTimeExpired && !hasAnswered && (
              <div className="waiting-message">
                <p>Time's up! You didn't submit an answer.</p>
              </div>
            )}
            {correctAnswer !== null && (
              <div className="round-results">
                <h4>Round Complete!</h4>
                <div className="scores">
                  {Object.entries(gameScores).map(([playerId, score]) => {
                    const player = players.find(p => p.id === playerId);
                    return player ? (
                      <div key={playerId} className="score-item">
                        <span>{player.name}</span>
                        <span>{score} points</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (gameState === 'finished') {
      return (
        <div className="lobby-game-finished">
          <h2>🎉 Big Game Complete!</h2>
          <div className="final-results">
            <h3>Final Scores</h3>
            {Object.entries(gameScores)
              .sort(([,a], [,b]) => b - a)
              .map(([playerId, score], index) => {
                const player = players.find(p => p.id === playerId);
                return player ? (
                  <div key={playerId} className={`final-score-item ${index === 0 ? 'winner' : ''}`}>
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{player.name}</span>
                    <span className="score">{score} points</span>
                  </div>
                ) : null;
              })}
          </div>
          <button 
            onClick={resetLobbyGame} 
            className="back-to-lobby-button"
          >
            Back to Lobby
          </button>
        </div>
      );
    }

    return null;
  };

  const renderMainScreen = () => {
    // Show game content if there's an active lobby game
    if (gameState !== 'idle') {
      return (
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
                ✏️ Change
              </button>
            </div>
            {renderConnectionStatus()}
            {renderError()}
          </div>
          
          <div className="lobby-game-layout">
            <div className="lobby-game-main">
              {renderLobbyGameContent()}
            </div>
            
            <div className="lobby-game-sidebar">
              {renderCompactPlayerList()}
              {renderVotingStatus()}
            </div>
          </div>
        </div>
      );
    }

    // Show normal lobby when no game is active
    return (
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
              ✏️ Change
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
              <h2>🎮 Start Big Game</h2>
              <p>Play trivia with everyone in the lobby!</p>
              <button 
                onClick={startLobbyGame}
                disabled={!isConnected || players.length < 2 || gameState !== 'idle'}
                className="primary-button big-game-button"
                title={players.length < 2 ? 'Need at least 2 players' : gameState !== 'idle' ? 'Game already in progress' : 'Start a game with all lobby players'}
              >
                {gameState === 'idle' ? 'Start Big Game' : gameState === 'starting' ? 'Starting...' : 'Game In Progress'}
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
  };

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