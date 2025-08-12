interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
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
      <button className="btn btn-primary" onClick={onStart}>
        Start Game
      </button>
    </div>
  );
}