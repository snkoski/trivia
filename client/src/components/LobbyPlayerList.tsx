import React from 'react';
import { useLobby } from '../contexts/LobbyContext';
import type { LobbyPlayer } from '@trivia/shared';
import './LobbyPlayerList.css';

interface LobbyPlayerListProps {
  className?: string;
}

export const LobbyPlayerList: React.FC<LobbyPlayerListProps> = ({ className = '' }) => {
  const { players } = useLobby();

  const formatJoinTime = (joinedAt: Date) => {
    const now = new Date();
    const joined = new Date(joinedAt);
    const diffMs = now.getTime() - joined.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just joined';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return joined.toLocaleDateString();
  };

  const renderPlayer = (player: LobbyPlayer) => {
    return (
      <div 
        key={player.id} 
        className={`player-item ${player.isConnected ? 'connected' : 'disconnected'}`}
      >
        <div className="player-avatar">
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="player-info">
          <div className="player-name">{player.name}</div>
          <div className="player-status">
            <span className={`status-indicator ${player.isConnected ? 'online' : 'offline'}`}>
              {player.isConnected ? '● Online' : '○ Offline'}
            </span>
            <span className="join-time">{formatJoinTime(player.joinedAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  const connectedPlayers = players.filter(p => p.isConnected);
  const disconnectedPlayers = players.filter(p => !p.isConnected);

  return (
    <div className={`lobby-player-list ${className}`}>
      <div className="players-header">
        <h3>Players</h3>
        <span className="player-count">
          {connectedPlayers.length} online
          {disconnectedPlayers.length > 0 && ` (+${disconnectedPlayers.length} offline)`}
        </span>
      </div>
      
      <div className="players-content">
        {players.length === 0 ? (
          <div className="no-players">
            <p>No players in lobby yet</p>
          </div>
        ) : (
          <div className="players-list">
            {/* Show connected players first */}
            {connectedPlayers.map(renderPlayer)}
            
            {/* Then show disconnected players if any */}
            {disconnectedPlayers.length > 0 && (
              <>
                <div className="section-divider">Recently offline</div>
                {disconnectedPlayers.map(renderPlayer)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};