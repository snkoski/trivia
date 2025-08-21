import React, { useState, useRef, useEffect } from 'react';
import { useLobby } from '../contexts/LobbyContext';
import type { ChatMessage } from '@trivia/shared';
import './LobbyChat.css';

interface LobbyChatProps {
  className?: string;
}

export const LobbyChat: React.FC<LobbyChatProps> = ({ className = '' }) => {
  const { chatMessages, sendMessage } = useLobby();
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    setIsSending(true);
    sendMessage(messageInput);
    setMessageInput('');
    setIsSending(false);
    
    // Focus back to input
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: ChatMessage) => {
    const isSystem = message.type === 'system';
    
    return (
      <div 
        key={message.id} 
        className={`chat-message ${isSystem ? 'system-message' : 'user-message'}`}
      >
        {isSystem ? (
          <div className="message-content system">
            <span className="message-text">{message.message}</span>
            <span className="message-time">{formatTime(message.timestamp)}</span>
          </div>
        ) : (
          <div className="message-content user">
            <div className="message-header">
              <span className="player-name">{message.playerName}</span>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
            <div className="message-text">{message.message}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`lobby-chat ${className}`}>
      <div className="chat-header">
        <h3>Chat</h3>
        <span className="message-count">{chatMessages.length} messages</span>
      </div>
      
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Be the first to say hello! 👋</p>
          </div>
        ) : (
          chatMessages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          maxLength={500}
        />
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || isSending}
          className="send-button"
        >
          {isSending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
};