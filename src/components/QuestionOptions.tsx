interface QuestionOptionsProps {
  options: string[];
  selectedAnswer: number | null;
  correctAnswer: number;
  showResult: boolean;
  onAnswerSelect: (index: number) => void;
}

export function QuestionOptions({ 
  options, 
  selectedAnswer, 
  correctAnswer, 
  showResult, 
  onAnswerSelect 
}: QuestionOptionsProps) {
  
  const getOptionClassName = (index: number) => {
    if (!showResult) return 'option';
    if (index === correctAnswer) return 'option correct';
    if (index === selectedAnswer && index !== correctAnswer) return 'option incorrect';
    return 'option';
  };

  return (
    <div className="options-container">
      {options.map((option, index) => (
        <button
          key={index}
          className={getOptionClassName(index)}
          onClick={() => onAnswerSelect(index)}
          disabled={showResult}
        >
          {option}
        </button>
      ))}
    </div>
  );
}