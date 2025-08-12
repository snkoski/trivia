import { useState } from 'react'
import './App.css'

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
}

const mockQuestions: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1
  },
  {
    id: 4,
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: 2
  },
  {
    id: 5,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: 3
  }
]

type GameState = 'start' | 'playing' | 'end'

function App() {
  const [gameState, setGameState] = useState<GameState>('start')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const currentQuestion = mockQuestions[currentQuestionIndex]

  const startGame = () => {
    setGameState('playing')
    setCurrentQuestionIndex(0)
    setScore(0)
    setSelectedAnswer(null)
    setShowResult(false)
  }

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResult) return
    
    setSelectedAnswer(optionIndex)
    setShowResult(true)
    
    if (optionIndex === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setGameState('end')
    }
  }

  const getOptionClassName = (index: number) => {
    if (!showResult) return 'option'
    if (index === currentQuestion.correctAnswer) return 'option correct'
    if (index === selectedAnswer && index !== currentQuestion.correctAnswer) return 'option incorrect'
    return 'option'
  }

  return (
    <div className="app">
      <div className="game-container">
        <h1 className="game-title">Trivia Game</h1>
        
        {gameState === 'start' && (
          <div className="start-screen">
            <h2>Welcome to Trivia!</h2>
            <p>Test your knowledge with {mockQuestions.length} questions</p>
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
                  {currentQuestionIndex < mockQuestions.length - 1 ? 'Next Question' : 'See Results'}
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
              {score === mockQuestions.length && "Perfect score! Amazing!"}
              {score >= mockQuestions.length * 0.8 && score < mockQuestions.length && "Great job!"}
              {score >= mockQuestions.length * 0.6 && score < mockQuestions.length * 0.8 && "Good effort!"}
              {score < mockQuestions.length * 0.6 && "Keep practicing!"}
            </p>
            <button className="btn btn-primary" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App