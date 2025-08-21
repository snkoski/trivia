import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';

interface GameScreenProps {
  onGameEnd?: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ onGameEnd }) => {
  const {
    isConnected,
    error,
    currentQuestion,
    players,
    isHost,
    gameState,
    scores,
    correctAnswer,
    hasAnswered,
    submitAnswer,
    requestNextQuestion,
    clearError,
    currentRoom
  } = useSocket();

  const {
    questionNumber,
    totalQuestions,
    timeRemaining,
    selectedAnswer,
    showResults,
    setSelectedAnswer,
    clearSelectedAnswer,
    setShowResults,
    formatTime,
    allPlayersAnswered,
    isAnswerCorrect,
    setQuestionProgress
  } = useGame();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Track question progress
  useEffect(() => {
    if (currentQuestion && currentRoom) {
      // Question index is 0-based, but we want to show 1-based to the user
      const currentQuestionNumber = (currentRoom.currentQuestionIndex || 0) + 1;
      // We now have 5 audio questions
      const totalQuestions = 5;
      setQuestionProgress(currentQuestionNumber, totalQuestions);
    }
  }, [currentQuestion, currentRoom, setQuestionProgress]);

  // Handle game state changes
  useEffect(() => {
    if (gameState === 'finished' && onGameEnd) {
      onGameEnd();
    }
  }, [gameState, onGameEnd]);

  // Auto-show results when all players have answered
  useEffect(() => {
    if (allPlayersAnswered(players) && !showResults && correctAnswer !== null) {
      setShowResults(true);
    }
  }, [players, showResults, correctAnswer, allPlayersAnswered, setShowResults]);

  // Handle audio playback
  useEffect(() => {
    if (currentQuestion?.audioUrl && audioRef.current) {
      audioRef.current.src = currentQuestion.audioUrl;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.log('Audio autoplay failed:', err));
      }
    }
  }, [currentQuestion?.audioUrl]);

  // Clear selected answer when new question arrives
  useEffect(() => {
    clearSelectedAnswer();
    setShowResults(false);
  }, [currentQuestion?.id, clearSelectedAnswer, setShowResults]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (!hasAnswered && !showResults) {
      setSelectedAnswer(optionIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer !== null) {
      submitAnswer(selectedAnswer);
    }
  };

  const handleNextQuestion = () => {
    requestNextQuestion();
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const handleAudioPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(isNaN(progress) ? 0 : progress);
    }
  };

  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    setAudioProgress(0);
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

  const renderQuestionHeader = () => (
    <div className="question-header">
      <div className="question-progress">
        <h2>Question {questionNumber} of {totalQuestions}</h2>
        {timeRemaining !== null && (
          <div className={`timer ${timeRemaining <= 10 ? 'timer-warning' : ''}`}>
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>
    </div>
  );

  const renderAudioPlayer = () => {
    if (!currentQuestion?.audioUrl) return null;

    return (
      <div className="audio-player" data-testid="audio-player">
        <audio
          ref={audioRef}
          onPlay={() => setIsAudioPlaying(true)}
          onPause={() => setIsAudioPlaying(false)}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
        />
        <div className="audio-controls">
          <button 
            onClick={isAudioPlaying ? handleAudioPause : handleAudioPlay}
            className="audio-control-button"
            aria-label={isAudioPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isAudioPlaying ? 'Pause' : 'Play'}
          </button>
          <div className="audio-progress">
            <div 
              className="audio-progress-bar" 
              style={{ width: `${audioProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="question-container">
        <h1 className="question-text">{currentQuestion.question}</h1>
        {renderAudioPlayer()}
      </div>
    );
  };

  const renderAnswerOptions = () => {
    if (!currentQuestion) return null;

    return (
      <div className="answer-options">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = showResults && correctAnswer === index;
          const isIncorrect = showResults && selectedAnswer === index && correctAnswer !== index;

          let className = 'answer-option';
          if (isSelected) className += ' selected';
          if (isCorrect) className += ' correct';
          if (isIncorrect) className += ' incorrect';

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswerSelect(index)}
              disabled={hasAnswered || showResults}
              aria-label={`Answer option ${index + 1}: ${option}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSubmitButton = () => {
    if (hasAnswered || showResults || selectedAnswer === null) return null;

    return (
      <div className="submit-container">
        <button
          onClick={handleSubmitAnswer}
          className="submit-button primary-button"
        >
          Submit Answer
        </button>
      </div>
    );
  };

  const renderResults = () => {
    if (!showResults || correctAnswer === null) return null;

    const userCorrect = isAnswerCorrect(selectedAnswer, correctAnswer);
    const correctOptionText = currentQuestion?.options[correctAnswer];

    return (
      <div className="results-container">
        <div className="result-message">
          {selectedAnswer !== null ? (
            userCorrect ? (
              <span className="correct-message">✅ You got it right!</span>
            ) : (
              <span className="incorrect-message">❌ Incorrect</span>
            )
          ) : (
            <span className="no-answer-message">⏰ Time's up!</span>
          )}
        </div>
        
        <div className="correct-answer">
          Correct Answer: {correctOptionText}
        </div>

        {isHost && questionNumber < totalQuestions && (
          <div className="host-controls">
            <button
              onClick={handleNextQuestion}
              className="next-question-button primary-button"
            >
              Next Question
            </button>
          </div>
        )}
        
        {isHost && questionNumber >= totalQuestions && (
          <div className="host-controls">
            <button
              onClick={handleNextQuestion}
              className="next-question-button primary-button"
            >
              End Game
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPlayerStatus = () => (
    <div className="player-status">
      <h2>Players</h2>
      <div className="players-grid">
        {players.map(player => (
          <div key={player.id} className="player-status-card">
            <div className="player-info">
              <span className="player-name">{player.name}</span>
              <span className="player-score">{scores[player.id] || 0}</span>
            </div>
            <div className="player-answer-status">
              {player.hasAnswered ? (
                <span className="answered">✓ Answered</span>
              ) : (
                <span className="waiting">⏳ Waiting</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!currentQuestion) {
    return (
      <div className="game-screen loading">
        <p>Loading question...</p>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {renderConnectionStatus()}
      {renderError()}
      {renderQuestionHeader()}
      {renderQuestion()}
      {renderAnswerOptions()}
      {renderSubmitButton()}
      {renderResults()}
      {renderPlayerStatus()}
    </div>
  );
};