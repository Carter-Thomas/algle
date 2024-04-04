import React, { useState, useEffect } from 'react';
import './App.css';
import algorithms from './RandomizedAlgs.json';
import { TwistyPlayer } from "cubing/twisty";
import { FaGithub } from 'react-icons/fa'; // Import GitHub icon from react-icons/fa

function App() {
  const [guess, setGuess] = useState('');
  const [solution, setSolution] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [guessLimitReached, setGuessLimitReached] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false); 
  const [showRules, setShowRules] = useState(false); // State for showing/hiding rules

  const MAX_GUESSES = 8;
  const ALGORITHM_STORAGE_KEY_PREFIX = 'algorithm';

  useEffect(() => {
    const currentDate = new Date();
    const firstApril = new Date(currentDate.getFullYear(), 3, 3); // April is 3 (0-indexed month)
    const puzzleDay = Math.floor((currentDate - firstApril) / (1000 * 60 * 60 * 24)) + 1; // Adding 1 to make April 1st puzzle #1
    const storedAlgorithm = localStorage.getItem(ALGORITHM_STORAGE_KEY_PREFIX + puzzleDay);

    if (storedAlgorithm) {
      setSolution(storedAlgorithm);
    } else {
      const algorithmKeys = Object.keys(algorithms);
      const randomIndex = puzzleDay % algorithmKeys.length;
      const randomAlgorithmKey = algorithmKeys[randomIndex];
      const newAlgorithm = algorithms[randomAlgorithmKey];
      localStorage.setItem(ALGORITHM_STORAGE_KEY_PREFIX + puzzleDay, newAlgorithm);
      setSolution(newAlgorithm);
    }
  }, []);

  useEffect(() => {
    if (gameWon || guessLimitReached) {
      setShowPlayer(true);
      console.log("Game Over")
    }
  }, [gameWon, guessLimitReached]);

  function handleSubmit(event) {
    event.preventDefault();

    if (gameWon || guessLimitReached) return; 

    // Split solution and guess into arrays for individual moves
    const solutionMoves = solution.split(' ');
    const guessMoves = guess.split(' ');

    // Check each move and provide feedback
    const newFeedback = solutionMoves.map((move, moveIndex) => {
      const guessedLetter = guessMoves[moveIndex];
      if (guessedLetter === move || guessedLetter === move.replace("'", "’")) {
        return { color: 'green', letter: guessedLetter }; // Correct move
      } else if (guessedLetter?.[0] === move[0]) {
        return { color: 'yellow', letter: guessedLetter }; // Correct base move but wrong direction
      } else {
        return { color: 'gray', letter: guessedLetter }; // Wrong move
      }
    });

    // Update the feedback history with the new guess
    setFeedbackHistory([...feedbackHistory, newFeedback]);

    // Check if the game is won
    const isGameWon = newFeedback.every(
      (feedbackItem) => feedbackItem.color === 'green',
    );
    if (isGameWon) {
      setGameWon(true);
    }

    setGuess('');

    // Check if guess limit is reached
    if (feedbackHistory.length + 1 >= MAX_GUESSES) {
      setGuessLimitReached(true);
    }
  }

  function handleInputChange(event) {
    if (!gameWon && !guessLimitReached) {
      setGuess(event.target.value);
    }
  }

  function handleShareClick() {
    const emojis = {
      green: '🟩', 
      yellow: '🟨', 
      gray: '⬜',
    };

    const currentDate = new Date();
    const firstApril = new Date(currentDate.getFullYear(), 3, 1); // April is 3 (0-indexed month)
    const puzzleDay = Math.floor((currentDate - firstApril) / (1000 * 60 * 60 * 24)) + 1; // Adding 1 to make April 1st puzzle #1

    const numberOfGuesses = feedbackHistory.length;

    // Determine if the game was won and calculate the number of guesses needed to win
    let guessesToWin = 'X';
    if (gameWon) {
      const winningGuessIndex = feedbackHistory.findIndex((feedback) =>
        feedback.every((item) => item.color === 'green'),
      );
      if (winningGuessIndex !== -1) {
        guessesToWin = winningGuessIndex + 1;
      }
    }

    // Generate textual representation of the game status with emojis
    const shareText = `Algle - A Rubik's Cube Algorithm Game\n\nPuzzle Day: ${puzzleDay}\nNumber of Guesses: ${guessesToWin}/8\n\nSolution: ||${solution}|| \n\nGuesses:\n${feedbackHistory.map((feedback, index) => `Guess ${index + 1}: ${feedback.map((item) => emojis[item.color]).join(' ')}`).join('\n')}`;

    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        alert('Text copied to clipboard!');
      })
      .catch((error) => {
        console.error('Failed to copy text to clipboard:', error);
      });
  }

  return (
    <div className="App">
      <h1>Algle - Guess the 3x3 Algorithm</h1>
      <button onClick={() => setShowRules(!showRules)}>How To Play</button> 
      {showRules && ( 
        <div className="rulesDropdown">
          <h1>How To Play</h1>
          <h2>Guess the Algle in 8 tries</h2>
          <h3>The color shown will denote how close your guessed turn was to the actual turn</h3>
          <h3>A gray color indicates that the move you guessed is not present in the box corresponding to the move</h3>
          <h3>A yellow color indicates the base move is correct, but the turn is the wrong direction</h3>
          <h3>A green color indicates your guess for that box was correct</h3>
          <h3>Each move should have a space in between it and the next move</h3>
          <h3>Wide moves are denoted as lowercase letters (i.e. r,l,f,b,etc.)</h3>
          <h3>The angle that is provided is generally where the first move begins. However, sometimes the first move will begin with an x or z rotation</h3>
          <h3>Algsets included: OLL, PLL, ZBLL, VLS, ELL</h3>
        </div>
      )}
      <div className="Twisty">
        <twisty-player
          puzzle="3x3x3"
          background="none"
          experimental-setup-anchor="end"
          alg={solution}
          control-panel="none"
        ></twisty-player>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Render feedback history */}
        {feedbackHistory.map((feedback, guessIndex) => (
          <div key={guessIndex} className="guessRow">
            <div className="moveContainer">
              {feedback.map((item, moveIndex) => (
                <div
                  key={moveIndex}
                  className="moveBox"
                  style={{ backgroundColor: item.color }}
                >
                  <span className="guessedLetter">{item.letter}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <input
          type="text"
          value={guess}
          onChange={handleInputChange}
          placeholder="Enter your guess..."
          disabled={gameWon || guessLimitReached} // Disable input if game is won or guess limit reached
        />
        <button type="submit" disabled={gameWon || guessLimitReached}>
          Submit
        </button>
      </form>
      {gameWon && <p>Congratulations! You guessed the solution.</p>}
      {guessLimitReached && (
        <p>
          Sorry, you've reached the guess limit. The correct solution was: {solution}
        </p>
      )}
      <div className="shareButtonContainer">
      <button className="shareButton" onClick={handleShareClick}>Share</button>
      </div>
      {showPlayer && (
        <>
          <div className="Twisty">
            <twisty-player
              puzzle="3x3x3"
              background="none"
              experimental-setup-anchor="end"
              alg={solution}
            ></twisty-player>
          </div>
        </>
      )}
      <div className="whitespace">
        <h1>ff</h1>
        <h1>ff</h1>
        <h1>ff</h1>
        <h1>ff</h1>
      </div>
      <footer className="footer">
        <p>Created By Carter Thomas, Algs sourced from speedcubedb.net</p>
        <a href="https://github.com/Carter-Thomas/algle" target="_blank" rel="noopener noreferrer">
          <FaGithub size={24} />
        </a>
      </footer>
    </div>
  );
}

export default App;
