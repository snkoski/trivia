import React, { useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { GlobalLeaderboard } from './GlobalLeaderboard';

interface ResultsScreenProps {
  onNewGame?: () => void;
  onLeaveRoom?: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ onNewGame, onLeaveRoom }) => {
  const [showGlobalLeaderboard, setShowGlobalLeaderboard] = useState(false);
  const { 
    isConnected,
    error,
    roomCode,
    players,
    isHost,
    scores,
    leaveRoom,
    createRoom,
    clearError,
    currentPlayerId
  } = useSocket();

  const {
    totalQuestions,
    winner,
    isTie,
    getLeaderboard
  } = useGame();

  const leaderboard = getLeaderboard(scores, players);
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const currentPlayerName = currentPlayer?.name || '';

  const handleNewGame = () => {
    if (isHost && currentPlayerName) {
      // First leave the current room
      leaveRoom();
      // Then create a new room
      // Use setTimeout to ensure the leave operation completes first
      setTimeout(() => {
        createRoom(currentPlayerName);
        if (onNewGame) {
          onNewGame();
        }
      }, 100);
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

  const getOrdinalSuffix = (position: number): string => {
    if (position % 10 === 1 && position % 100 !== 11) return 'st';
    if (position % 10 === 2 && position % 100 !== 12) return 'nd';
    if (position % 10 === 3 && position % 100 !== 13) return 'rd';
    return 'th';
  };

  const calculateAverageScore = (): number => {
    if (leaderboard.length <= 1) return 0;
    const totalScore = leaderboard.reduce((sum, player) => sum + player.score, 0);
    return Math.round(totalScore / leaderboard.length);
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
        <button onClick={clearError} className="dismiss-button">
          Dismiss
        </button>
      </div>
    );
  };

  const renderGameHeader = () => (
    <div className="game-header">
      <h1>Game Over</h1>
      <div className="game-summary">
        <span className="questions-completed">{totalQuestions} questions completed</span>
        <div className="room-info">
          <span>Room: {roomCode}</span>
          <span>{players.length} Players</span>
        </div>
      </div>
    </div>
  );

  const renderWinnerAnnouncement = () => {
    if (isTie) {
      return (
        <div className="winner-announcement tie">
          <h2>🤝 It's a Tie!</h2>
          <p>Great game everyone!</p>
        </div>
      );
    }

    if (winner) {
      const winnerName = winner.name;
      return (
        <div className="winner-announcement">
          <h2>🏆 {winnerName} Wins!</h2>
          <p>Congratulations!</p>
        </div>
      );
    }

    return null;
  };

  const renderLeaderboard = () => (
    <div className="leaderboard-section">
      <h2>Final Scores</h2>
      <ol className="leaderboard" role="list">
        {leaderboard.map((player, index) => {
          const position = index + 1;
          const isWinner = winner && player.id === winner.id;
          
          return (
            <li 
              key={player.id} 
              className={`leaderboard-item ${isWinner ? 'winner' : ''}`}
            >
              <div className="position">
                {position === 1 && <span className="crown">👑</span>}
                <span className="rank">{position}{getOrdinalSuffix(position)}</span>
              </div>
              <div className="player-info">
                <span className="player-name">{player.name}</span>
              </div>
              <div className="player-score">
                <span className="score">{player.score}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );

  const renderGameStats = () => {
    const averageScore = calculateAverageScore();
    
    return (
      <div className="game-stats">
        <h2>Game Stats</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Questions</span>
            <span className="stat-value">{totalQuestions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Players</span>
            <span className="stat-value">{players.length}</span>
          </div>
          {leaderboard.length > 1 && (
            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">{averageScore}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActions = () => (
    <div className="game-actions">
      <button
        onClick={() => setShowGlobalLeaderboard(true)}
        className="global-leaderboard-button secondary-button"
      >
        🏆 Global Leaderboard
      </button>
      {isHost && (
        <button
          onClick={handleNewGame}
          className="new-game-button primary-button"
        >
          New Game
        </button>
      )}
      <button
        onClick={handleLeaveRoom}
        className="leave-room-button secondary-button"
      >
        Leave Room
      </button>
    </div>
  );

  return (
    <div className="results-screen">
      {renderConnectionStatus()}
      {renderError()}
      {renderGameHeader()}
      {renderWinnerAnnouncement()}
      {renderLeaderboard()}
      {renderGameStats()}
      {renderActions()}
      
      {showGlobalLeaderboard && (
        <GlobalLeaderboard onClose={() => setShowGlobalLeaderboard(false)} />
      )}
    </div>
  );
};