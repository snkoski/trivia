import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LobbyScreen } from './LobbyScreen';
import { useSocket } from '../contexts/SocketContext';
import React from 'react';

// Mock the SocketContext
vi.mock('../contexts/SocketContext', () => ({
  useSocket: vi.fn()
}));

describe('LobbyScreen', () => {
  const mockCreateRoom = vi.fn();
  const mockJoinRoom = vi.fn();
  const mockClearError = vi.fn();

  const defaultMockSocket = {
    isConnected: true,
    error: null,
    roomCode: null,
    createRoom: mockCreateRoom,
    joinRoom: mockJoinRoom,
    clearError: mockClearError,
    socket: { id: 'test-socket-id' },
    currentRoom: null,
    players: [],
    isHost: false,
    gameState: 'waiting',
    currentQuestion: null,
    scores: {},
    correctAnswer: null,
    hasAnswered: false,
    leaveRoom: vi.fn(),
    startGame: vi.fn(),
    submitAnswer: vi.fn(),
    requestNextQuestion: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSocket).mockReturnValue(defaultMockSocket);
  });

  describe('initial render', () => {
    it('should display welcome message', () => {
      render(<LobbyScreen />);
      expect(screen.getByText(/Welcome to Trivia Game/i)).toBeInTheDocument();
    });

    it('should show connection status when connected', () => {
      render(<LobbyScreen />);
      expect(screen.getByText(/Connected/i)).toBeInTheDocument();
    });

    it('should show disconnected status when not connected', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        isConnected: false
      });
      
      render(<LobbyScreen />);
      expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
    });

    it('should display create and join options', () => {
      render(<LobbyScreen />);
      expect(screen.getByRole('button', { name: /Create New Room/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Join Existing Room/i })).toBeInTheDocument();
    });
  });

  describe('create room flow', () => {
    it('should show create room form when create button clicked', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const createButton = screen.getByRole('button', { name: /Create New Room/i });
      await user.click(createButton);
      
      expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Room/i })).toBeInTheDocument();
    });

    it('should call createRoom with player name', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const createButton = screen.getByRole('button', { name: /Create New Room/i });
      await user.click(createButton);
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i);
      await user.type(nameInput, 'Alice');
      
      const submitButton = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitButton);
      
      expect(mockCreateRoom).toHaveBeenCalledWith('Alice');
    });

    it('should not submit with empty name', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const createButton = screen.getByRole('button', { name: /Create New Room/i });
      await user.click(createButton);
      
      const submitButton = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitButton);
      
      expect(mockCreateRoom).not.toHaveBeenCalled();
    });

    it('should show validation error for empty name', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const createButton = screen.getByRole('button', { name: /Create New Room/i });
      await user.click(createButton);
      
      const submitButton = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/Please enter your name/i)).toBeInTheDocument();
    });

    it('should show back button in create form', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const createButton = screen.getByRole('button', { name: /Create New Room/i });
      await user.click(createButton);
      
      const backButton = screen.getByRole('button', { name: /Back/i });
      expect(backButton).toBeInTheDocument();
      
      await user.click(backButton);
      expect(screen.getByRole('button', { name: /Create New Room/i })).toBeInTheDocument();
    });
  });

  describe('join room flow', () => {
    it('should show join room form when join button clicked', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const joinButton = screen.getByRole('button', { name: /Join Existing Room/i });
      await user.click(joinButton);
      
      expect(screen.getByPlaceholderText(/Enter room code/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Join Room/i })).toBeInTheDocument();
    });

    it('should call joinRoom with room code and player name', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const joinButton = screen.getByRole('button', { name: /Join Existing Room/i });
      await user.click(joinButton);
      
      const codeInput = screen.getByPlaceholderText(/Enter room code/i);
      await user.type(codeInput, 'ABC123');
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i);
      await user.type(nameInput, 'Bob');
      
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitButton);
      
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123', 'Bob');
    });

    it('should convert room code to uppercase', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const joinButton = screen.getByRole('button', { name: /Join Existing Room/i });
      await user.click(joinButton);
      
      const codeInput = screen.getByPlaceholderText(/Enter room code/i);
      await user.type(codeInput, 'abc123');
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i);
      await user.type(nameInput, 'Bob');
      
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitButton);
      
      expect(mockJoinRoom).toHaveBeenCalledWith('ABC123', 'Bob');
    });

    it('should validate room code length', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const joinButton = screen.getByRole('button', { name: /Join Existing Room/i });
      await user.click(joinButton);
      
      const codeInput = screen.getByPlaceholderText(/Enter room code/i);
      await user.type(codeInput, 'ABC');
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i);
      await user.type(nameInput, 'Bob');
      
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitButton);
      
      expect(screen.getByText(/Room code must be 6 characters/i)).toBeInTheDocument();
      expect(mockJoinRoom).not.toHaveBeenCalled();
    });

    it('should not submit with empty fields', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const joinButton = screen.getByRole('button', { name: /Join Existing Room/i });
      await user.click(joinButton);
      
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitButton);
      
      expect(mockJoinRoom).not.toHaveBeenCalled();
      expect(screen.getByText(/Please enter room code/i)).toBeInTheDocument();
      expect(screen.getByText(/Please enter your name/i)).toBeInTheDocument();
    });

    it('should show back button in join form', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const joinButton = screen.getByRole('button', { name: /Join Existing Room/i });
      await user.click(joinButton);
      
      const backButton = screen.getByRole('button', { name: /Back/i });
      expect(backButton).toBeInTheDocument();
      
      await user.click(backButton);
      expect(screen.getByRole('button', { name: /Join Existing Room/i })).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error message when error exists', () => {
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        error: 'Room not found'
      });
      
      render(<LobbyScreen />);
      expect(screen.getByText(/Room not found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
    });

    it('should call clearError when dismiss button clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        error: 'Room not found'
      });
      
      render(<LobbyScreen />);
      const dismissButton = screen.getByRole('button', { name: /Dismiss/i });
      await user.click(dismissButton);
      
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('loading states', () => {
    it('should disable form while creating room', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const createButton = screen.getByRole('button', { name: /Create New Room/i });
      await user.click(createButton);
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i);
      await user.type(nameInput, 'Alice');
      
      // Simulate loading state
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        roomCode: null // Still null, indicating loading
      });
      
      const submitButton = screen.getByRole('button', { name: /Create Room/i });
      await user.click(submitButton);
      
      // Should show loading state
      expect(screen.getByText(/Creating room.../i)).toBeInTheDocument();
    });

    it('should disable form while joining room', async () => {
      const user = userEvent.setup();
      render(<LobbyScreen />);
      
      const joinButton = screen.getByRole('button', { name: /Join Existing Room/i });
      await user.click(joinButton);
      
      const codeInput = screen.getByPlaceholderText(/Enter room code/i);
      await user.type(codeInput, 'ABC123');
      
      const nameInput = screen.getByPlaceholderText(/Enter your name/i);
      await user.type(nameInput, 'Bob');
      
      const submitButton = screen.getByRole('button', { name: /Join Room/i });
      await user.click(submitButton);
      
      // Should show loading state
      expect(screen.getByText(/Joining room.../i)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should call onRoomJoined callback when room is joined', () => {
      const onRoomJoined = vi.fn();
      vi.mocked(useSocket).mockReturnValue({
        ...defaultMockSocket,
        roomCode: 'ABC123',
        currentRoom: {
          code: 'ABC123',
          players: [],
          state: 'waiting',
          currentQuestionIndex: 0,
          maxPlayers: 8,
          createdAt: new Date()
        }
      });
      
      render(<LobbyScreen onRoomJoined={onRoomJoined} />);
      
      expect(onRoomJoined).toHaveBeenCalled();
    });
  });
});