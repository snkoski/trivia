interface GameHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
}

export function GameHeader({ currentQuestion, totalQuestions, score }: GameHeaderProps) {
  return (
    <div className="game-header">
      <span className="question-number">
        Question {currentQuestion} of {totalQuestions}
      </span>
      <span className="score">Score: {score}</span>
    </div>
  );
}