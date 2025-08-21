import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { socketService } from '../services/socket';
import { useSocket } from './SocketContext';
import type { LobbyPlayer, ChatMessage } from '@trivia/shared';

interface LobbyContextType {
  // Lobby state
  isInLobby: boolean;
  players: LobbyPlayer[];
  chatMessages: ChatMessage[];
  
  // Actions
  joinLobby: (playerName: string) => void;
  leaveLobby: () => void;
  sendMessage: (message: string) => void;
  
  // Loading state
  isJoining: boolean;
}

const LobbyContext = createContext<LobbyContextType | null>(null);

export const useLobby = (): LobbyContextType => {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error('useLobby must be used within a LobbyProvider');
  }
  return context;
};

interface LobbyProviderProps {
  children: ReactNode;
}

export const LobbyProvider: React.FC<LobbyProviderProps> = ({ children }) => {
  const { isConnected, socket } = useSocket();
  const [isInLobby, setIsInLobby] = useState(false);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isJoining, setIsJoining] = useState(false);

  // Setup socket listeners only when connected
  useEffect(() => {
    if (!isConnected || !socket) {
      return;
    }

    // Define callbacks so we can remove them later
    const handlePlayersUpdated = (updatedPlayers: LobbyPlayer[]) => {
      setPlayers(updatedPlayers);
    };

    const handlePlayerJoined = (player: LobbyPlayer) => {
      console.log(`${player.name} joined the lobby`);
    };

    const handlePlayerLeft = (playerId: string) => {
      console.log(`Player ${playerId} left the lobby`);
    };

    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages(prev => {
        // Check if message already exists to prevent duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleChatHistory = (messages: ChatMessage[]) => {
      setChatMessages(messages);
    };

    try {
      // Remove any existing listeners first
      socketService.offLobbyPlayersUpdated();
      socketService.offLobbyPlayerJoined();
      socketService.offLobbyPlayerLeft();
      socketService.offLobbyChatMessage();
      socketService.offLobbyChatHistory();

      // Add new listeners
      socketService.onLobbyPlayersUpdated(handlePlayersUpdated);
      socketService.onLobbyPlayerJoined(handlePlayerJoined);
      socketService.onLobbyPlayerLeft(handlePlayerLeft);
      socketService.onLobbyChatMessage(handleChatMessage);
      socketService.onLobbyChatHistory(handleChatHistory);
    } catch (error) {
      console.error('Error setting up lobby listeners:', error);
    }

    // Cleanup function
    return () => {
      // Remove listeners
      socketService.offLobbyPlayersUpdated(handlePlayersUpdated);
      socketService.offLobbyPlayerJoined(handlePlayerJoined);
      socketService.offLobbyPlayerLeft(handlePlayerLeft);
      socketService.offLobbyChatMessage(handleChatMessage);
      socketService.offLobbyChatHistory(handleChatHistory);
      
      // Leave lobby if needed
      if (isInLobby && isConnected) {
        try {
          socketService.leaveLobby();
        } catch (error) {
          console.error('Error leaving lobby on cleanup:', error);
        }
      }
    };
  }, [isConnected, socket, isInLobby]);

  const joinLobby = useCallback((playerName: string) => {
    if (isJoining || isInLobby || !isConnected) return;
    
    setIsJoining(true);
    try {
      socketService.joinLobby(playerName);
      setIsInLobby(true);
    } catch (error) {
      console.error('Error joining lobby:', error);
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, isInLobby, isConnected]);

  const leaveLobby = useCallback(() => {
    if (!isInLobby || !isConnected) return;
    
    try {
      socketService.leaveLobby();
      setIsInLobby(false);
      setPlayers([]);
      setChatMessages([]);
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  }, [isInLobby, isConnected]);

  const sendMessage = useCallback((message: string) => {
    if (!isInLobby || !message.trim() || !isConnected) return;
    
    try {
      socketService.sendLobbyMessage(message.trim());
    } catch (error) {
      console.error('Error sending lobby message:', error);
    }
  }, [isInLobby, isConnected]);

  const value: LobbyContextType = {
    isInLobby,
    players,
    chatMessages,
    joinLobby,
    leaveLobby,
    sendMessage,
    isJoining
  };

  return (
    <LobbyContext.Provider value={value}>
      {children}
    </LobbyContext.Provider>
  );
};