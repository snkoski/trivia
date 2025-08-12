import { useState } from 'react';
import type { Question } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { QuestionOptions } from './QuestionOptions';
import { GameHeader } from './GameHeader';

interface GameScreenProps {
  questions: Question[];
  onGameEnd: (finalScore: number) => void;
}

export function GameScreen({ questions, onGameEnd }: GameScreenProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shouldPauseAudio, setShouldPauseAudio] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResult) return;

    setSelectedAnswer(optionIndex);
    setShowResult(true);
    setShouldPauseAudio(true);

    if (optionIndex === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShouldPauseAudio(false);
    } else {
      onGameEnd(score);
    }
  };

  return (
    <div className="game-screen">
      <GameHeader
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        score={score}
      />

      <div className="question-container">
        <h2 className="question-text">{currentQuestion.question}</h2>

        {currentQuestion.audioUrl && (
          <AudioPlayer
            audioUrl={currentQuestion.audioUrl}
            shouldPause={shouldPauseAudio}
          />
        )}

        <QuestionOptions
          options={currentQuestion.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={currentQuestion.correctAnswer}
          showResult={showResult}
          onAnswerSelect={handleAnswerSelect}
        />

        {showResult && (
          <button className="btn btn-primary next-btn" onClick={handleNextQuestion}>
            {currentQuestionIndex < questions.length - 1
              ? 'Next Question'
              : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
}