import React, { useState, useEffect } from 'react';
import './App.css';
import algorithms from './RandomizedAlgs.json';
import { TwistyPlayer } from "cubing/twisty";

function App() {
  const [guess, setGuess] = useState('');
  const [solution, setSolution] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [guessLimitReached, setGuessLimitReached] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false); 

  const MAX_GUESSES = 8;
  const ALGORITHM_STORAGE_KEY_PREFIX = 'algorithm';

  useEffect(() => {
    const currentDate = new Date();
    const firstApril = new Date(currentDate.getFullYear(), 3, 1); // April is 3 (0-indexed month)
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

    // Reset the guess input
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
      <div className="Twisty">
        <twisty-player
          puzzle="3x3x3"
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
      <button onClick={handleShareClick}>Share</button>
      {showPlayer && (
        <>
          <div className="Twisty">
            <twisty-player
              puzzle="3x3x3"
              experimental-setup-anchor="end"
              alg={solution}
            ></twisty-player>
          </div>
        </>
      )}
      <h3>Algs are from speedcubedb.net</h3>
    </div>
  );
}

export default App;
