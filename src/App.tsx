import { useState, useRef, useEffect } from 'react';
import './App.css';

interface Question {
  id: number;
  question: string;
  audioUrl?: string;
  options: string[];
  correctAnswer: number;
}

const mockQuestions: Question[] = [
  {
    id: 1,
    question: 'Name this song or artist:',
    audioUrl: '/audio/song1.mp3',
    options: [
      'The Beatles - Hey Jude',
      'The Rolling Stones - Paint It Black',
      'Led Zeppelin - Stairway to Heaven',
      'Pink Floyd - Wish You Were Here'
    ],
    correctAnswer: 0
  },
  {
    id: 2,
    question: 'Which movie is this theme from?',
    audioUrl: '/audio/song2.wav',
    options: ['Star Wars', 'Indiana Jones', 'Jurassic Park', 'Harry Potter'],
    correctAnswer: 0
  },
  {
    id: 3,
    question: 'Name the composer of this classical piece:',
    audioUrl: '/audio/song3.wav',
    options: ['Mozart', 'Beethoven', 'Bach', 'Chopin'],
    correctAnswer: 1
  },
  {
    id: 4,
    question: 'What genre best describes this music?',
    audioUrl: '/audio/song4.wav',
    options: ['Jazz', 'Blues', 'Rock', 'Classical'],
    correctAnswer: 0
  },
  {
    id: 5,
    question: 'Name this instrument:',
    audioUrl: '/audio/song5.wav',
    options: ['Violin', 'Cello', 'Viola', 'Double Bass'],
    correctAnswer: 0
  }
];

type GameState = 'start' | 'playing' | 'end';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentQuestion = mockQuestions[currentQuestionIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
        }
      };
    }
  }, [currentQuestionIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsPlaying(false);
  };

  const playPauseAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResult) return;

    setSelectedAnswer(optionIndex);
    setShowResult(true);

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (optionIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    } else {
      setGameState('end');
    }
  };

  const getOptionClassName = (index: number) => {
    if (!showResult) return 'option';
    if (index === currentQuestion.correctAnswer) return 'option correct';
    if (index === selectedAnswer && index !== currentQuestion.correctAnswer)
      return 'option incorrect';
    return 'option';
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="game-container">
        <h1 className="game-title">Music Trivia Game</h1>

        {gameState === 'start' && (
          <div className="start-screen">
            <h2>Welcome to Music Trivia!</h2>
            <p>Listen to audio clips and test your musical knowledge</p>
            <div className="instructions">
              <h3>How to play:</h3>
              <ul>
                <li>Click play to listen to the audio clip</li>
                <li>Choose the correct answer from 4 options</li>
                <li>Score points for each correct answer</li>
              </ul>
            </div>
            <button className="btn btn-primary" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="game-screen">
            <div className="game-header">
              <span className="question-number">
                Question {currentQuestionIndex + 1} of {mockQuestions.length}
              </span>
              <span className="score">Score: {score}</span>
            </div>

            <div className="question-container">
              <h2 className="question-text">{currentQuestion.question}</h2>

              {currentQuestion.audioUrl && (
                <div className="audio-player">
                  <audio ref={audioRef} src={currentQuestion.audioUrl} preload="auto" />

                  <button
                    className="play-button"
                    onClick={playPauseAudio}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <div className="audio-progress">
                    <div className="time-display">{formatTime(currentTime)}</div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                      />
                    </div>
                    <div className="time-display">{formatTime(duration)}</div>
                  </div>

                  <div className="audio-hint">
                    {!isPlaying && currentTime === 0 && 'Click play to listen to the audio'}
                    {isPlaying && 'Listening...'}
                    {!isPlaying && currentTime > 0 && 'Click play to continue listening'}
                  </div>
                </div>
              )}

              <div className="options-container">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={getOptionClassName(index)}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {showResult && (
                <button className="btn btn-primary next-btn" onClick={nextQuestion}>
                  {currentQuestionIndex < mockQuestions.length - 1
                    ? 'Next Question'
                    : 'See Results'}
                </button>
              )}
            </div>
          </div>
        )}

        {gameState === 'end' && (
          <div className="end-screen">
            <h2>Game Over!</h2>
            <p className="final-score">
              Your final score: {score} out of {mockQuestions.length}
            </p>
            <p className="score-message">
              {score === mockQuestions.length && "Perfect score! You're a music expert!"}
              {score >= mockQuestions.length * 0.8 &&
                score < mockQuestions.length &&
                'Great job! You know your music!'}
              {score >= mockQuestions.length * 0.6 &&
                score < mockQuestions.length * 0.8 &&
                'Good effort! Keep listening!'}
              {score < mockQuestions.length * 0.6 && 'Keep practicing your music knowledge!'}
            </p>
            <button className="btn btn-primary" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
