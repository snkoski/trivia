interface EndScreenProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
}

export function EndScreen({ score, totalQuestions, onRestart }: EndScreenProps) {
  const getScoreMessage = () => {
    const percentage = score / totalQuestions;
    if (percentage === 1) return "Perfect score! You're a music expert!";
    if (percentage >= 0.8) return "Great job! You know your music!";
    if (percentage >= 0.6) return "Good effort! Keep listening!";
    return "Keep practicing your music knowledge!";
  };

  return (
    <div className="end-screen">
      <h2>Game Over!</h2>
      <p className="final-score">
        Your final score: {score} out of {totalQuestions}
      </p>
      <p className="score-message">{getScoreMessage()}</p>
      <button className="btn btn-primary" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}