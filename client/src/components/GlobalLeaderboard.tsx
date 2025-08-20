import React, { useState, useEffect } from 'react';
import './GlobalLeaderboard.css';

interface GlobalLeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  roomCode: string;
  timestamp: number;
  gameDuration?: number;
}

interface GlobalLeaderboardData {
  gameId: string;
  questionCount: number;
  leaderboard: GlobalLeaderboardEntry[];
  total: number;
}

interface GlobalLeaderboardProps {
  onClose?: () => void;
}

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({ onClose }) => {
  const [leaderboardData, setLeaderboardData] = useState<GlobalLeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/leaderboard?limit=20`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLeaderboardData(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRankDisplay = (index: number): React.ReactNode => {
    switch (index) {
      case 0: return <span className='trophy gold'>🥇</span>;
      case 1: return <span className='trophy silver'>🥈</span>;
      case 2: return <span className='trophy bronze'>🥉</span>;
      default: return <span className='rank-number'>#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className='global-leaderboard-overlay'>
        <div className='global-leaderboard-modal'>
          <div className='loading-state'>
            <div className='loading-spinner'></div>
            <p>Loading global leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='global-leaderboard-overlay'>
        <div className='global-leaderboard-modal'>
          <div className='error-state'>
            <h2>Error Loading Leaderboard</h2>
            <p>{error}</p>
            <div className='button-group'>
              <button onClick={fetchLeaderboard} className='retry-button'>
                Try Again
              </button>
              {onClose && (
                <button onClick={onClose} className='close-button'>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboardData) {
    return null;
  }

  return (
    <div className='global-leaderboard-overlay'>
      <div className='global-leaderboard-modal'>
        <div className='leaderboard-header'>
          <div className='header-decoration'>
            <div className='star star-1'>⭐</div>
            <div className='star star-2'>✨</div>
            <div className='star star-3'>🌟</div>
          </div>
          <h2>🏆 Global Leaderboard</h2>
          <p className='game-info'>
            🎵 Music Trivia • {leaderboardData.questionCount} Questions • 🎮 Cross-Room Competition
          </p>
          {onClose && (
            <button onClick={onClose} className='close-button-x' aria-label='Close'>
              ×
            </button>
          )}
        </div>

        <div className='leaderboard-content'>
          {leaderboardData.leaderboard.length === 0 ? (
            <div className='empty-state'>
              <div className='empty-icon'>🏆</div>
              <h3>🌟 No Champions Yet! 🌟</h3>
              <p>🎯 Be the first to complete a game and claim your spot on the global leaderboard!</p>
              <div className='empty-encouragement'>
                <span className='sparkle'>✨</span>
                <span>Ready to make history?</span>
                <span className='sparkle'>✨</span>
              </div>
            </div>
          ) : (
            <>
              <div className='leaderboard-stats'>
                <span className='total-players'>
                  {leaderboardData.total} total score{leaderboardData.total !== 1 ? 's' : ''}
                </span>
                <button onClick={fetchLeaderboard} className='refresh-button' title='Refresh leaderboard'>
                  <span className='refresh-icon'>🔄</span>
                </button>
              </div>

              <div className='leaderboard-table-container'>
                <table className='leaderboard-table'>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Score</th>
                      <th>Room</th>
                      <th>Duration</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.leaderboard.map((entry, index) => (
                      <tr 
                        key={`${entry.playerId}-${entry.timestamp}`} 
                        className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className='rank-cell'>
                          <div className='rank'>{getRankDisplay(index)}</div>
                        </td>
                        <td className='player-cell'>
                          <div className='player-info'>
                            <span className='player-name'>{entry.playerName}</span>
                            {index < 3 && <span className='crown'>👑</span>}
                          </div>
                        </td>
                        <td className='score-cell'>
                          <div className='score-wrapper'>
                            <span className='score'>{entry.score.toLocaleString()}</span>
                            <span className='score-label'>pts</span>
                          </div>
                        </td>
                        <td className='room-cell'>
                          <span className='room-code'>{entry.roomCode}</span>
                        </td>
                        <td className='duration-cell'>
                          <span className='duration'>⏱️ {formatDuration(entry.gameDuration)}</span>
                        </td>
                        <td className='date-cell'>
                          <span className='date'>📅 {formatTimestamp(entry.timestamp)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className='leaderboard-footer'>
          {onClose && (
            <button onClick={onClose} className='close-button'>
              Close
            </button>
          )}
          <p className='footer-text'>
            🌍 Scores from all rooms • 🎮 Real-time competition • 🏆 Glory awaits
          </p>
        </div>
      </div>
    </div>
  );
};