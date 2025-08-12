import { useState } from 'react';
import './App.css';
import type { GameState } from './types';
import { mockQuestions } from './data/questions';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { EndScreen } from './components/EndScreen';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [finalScore, setFinalScore] = useState(0);

  const handleStartGame = () => {
    setGameState('playing');
    setFinalScore(0);
  };

  const handleGameEnd = (score: number) => {
    setFinalScore(score);
    setGameState('end');
  };

  const handleRestart = () => {
    setGameState('playing');
    setFinalScore(0);
  };

  return (
    <div className="app">
      <div className="game-container">
        <h1 className="game-title">Music Trivia Game</h1>

        {gameState === 'start' && (
          <StartScreen onStart={handleStartGame} />
        )}

        {gameState === 'playing' && (
          <GameScreen 
            questions={mockQuestions} 
            onGameEnd={handleGameEnd} 
          />
        )}

        {gameState === 'end' && (
          <EndScreen
            score={finalScore}
            totalQuestions={mockQuestions.length}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}

export default App;