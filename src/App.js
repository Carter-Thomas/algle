import React, { useState, useEffect } from 'react';
import './App.css';
import algorithms from './Algs.json'; // Import Algs.json file

function App() {
  const [guess, setGuess] = useState('');
  const [solution, setSolution] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [guessLimitReached, setGuessLimitReached] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false); // State to control whether to show the player

  const MAX_GUESSES = 8;
  const ALGORITHM_STORAGE_KEY = 'rubiks_algorithm';
  const LAST_PLAY_STORAGE_KEY = 'rubiks_last_play';

  useEffect(() => {
    const lastPlayDate = localStorage.getItem(LAST_PLAY_STORAGE_KEY);
    const currentDate = new Date().toDateString();

    if (lastPlayDate !== currentDate) {
      // Generate a new algorithm for the day if it's a new day
      const algorithmKeys = Object.keys(algorithms);
      const randomIndex = Math.floor(Math.random() * algorithmKeys.length);
      const randomAlgorithmKey = algorithmKeys[randomIndex];
      const newAlgorithm = algorithms[randomAlgorithmKey];
      localStorage.setItem(ALGORITHM_STORAGE_KEY, newAlgorithm);
      localStorage.setItem(LAST_PLAY_STORAGE_KEY, currentDate);
    }

    setSolution(localStorage.getItem(ALGORITHM_STORAGE_KEY));
  }, []);

  useEffect(() => {
    // Check if the game is over and set the showPlayer state to true
    if (gameWon || guessLimitReached) {
      setShowPlayer(true);
    }
  }, [gameWon, guessLimitReached]);

  function handleSubmit(event) {
    event.preventDefault();

    if (gameWon || guessLimitReached) return; // If game is won or guess limit reached, do nothing

    // Split solution and guess into arrays for individual moves
    const solutionMoves = solution.split(' ');
    const guessMoves = guess.split(' ');

    // Check each move for correctness and provide feedback
    const newFeedback = solutionMoves.map((move, moveIndex) => {
      const guessedLetter = guessMoves[moveIndex];
      if (guessedLetter === move) {
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
    const isGameWon = newFeedback.every((feedbackItem) => feedbackItem.color === 'green');
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
    // Define emojis for feedback
    const emojis = {
      green: '🟩', // Green square
      yellow: '🟨', // Yellow square
      gray: '⬜', // Gray square
    };
  
    // Count the number of guesses made
    const numberOfGuesses = feedbackHistory.length;
  
    // Determine if the game was won and calculate the number of guesses needed to win
    let guessesToWin = 'X';
    if (gameWon) {
      const winningGuessIndex = feedbackHistory.findIndex((feedback) => feedback.every((item) => item.color === 'green'));
      if (winningGuessIndex !== -1) {
        guessesToWin = winningGuessIndex + 1;
      }
    }
  
    // Get today's puzzle number (assuming each day starts a new puzzle)
    const today = new Date();
    const puzzleNumber = 1; // Adjusted to always be 1 for simplicity in this example
  
    // Generate textual representation of the game status with emojis
    const shareText = `Algle - A Rubik's Cube Algorithm Game\n\nPuzzle Number: ${puzzleNumber}\nNumber of Guesses: ${guessesToWin}/8\n\nSolution: ${solution}\n\nGuesses:\n${feedbackHistory.map((feedback, index) => `Guess ${index + 1}: ${feedback.map((item) => emojis[item.color]).join(' ')}`).join('\n')}`;
  
    // Copy shareText to clipboard
    navigator.clipboard.writeText(shareText)
      .then(() => {
        alert('Text copied to clipboard!');
      })
      .catch((error) => {
        console.error('Failed to copy text to clipboard:', error);
      });
  }

  return (
    <div className="App">
      <h1>Guess the Rubik's Cube Algorithm</h1>
      <form onSubmit={handleSubmit}>
        {/* Render feedback history */}
        {feedbackHistory.map((feedback, guessIndex) => (
          <div key={guessIndex} className="guessRow">
            <div className="moveContainer">
              {feedback.map((item, moveIndex) => (
                <div key={moveIndex} className="moveBox" style={{ backgroundColor: item.color }}>
                  <span className="guessedLetter">{item.letter}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Input field and submit button */}
        <input
          type="text"
          value={guess}
          onChange={handleInputChange}
          placeholder="Enter your guess..."
          disabled={gameWon || guessLimitReached} // Disable input if game is won or guess limit reached
        />
        <button type="submit" disabled={gameWon || guessLimitReached}>Submit</button>
      </form>
      {/* Display game outcome messages */}
      {gameWon && <p>Congratulations! You guessed the solution.</p>}
      {guessLimitReached && <p>Sorry, you've reached the guess limit. The correct solution was: {solution}</p>}
      {/* Share button */}
      <button onClick={handleShareClick}>Share</button>
      {/* Render Twisty Player if showPlayer is true */}
      {showPlayer && <TwistyPlayerComponent alg={solution} />}
    </div>
  );
}

// Component to load TwistyPlayer
const TwistyPlayerComponent = ({ alg }) => {
  useEffect(() => {
    if (alg) {
      importTwistyPlayer(alg); // Pass the solution algorithm to importTwistyPlayer
    }
  }, [alg]);

  const importTwistyPlayer = async (alg) => {
    const { TwistyPlayer } = await import("https://cdn.cubing.net/js/cubing/twisty");

    const playerContainer = document.createElement('div');
    playerContainer.classList.add('TwistyPlayerContainer'); // Add TwistyPlayerContainer class
    document.body.appendChild(playerContainer);

    const player = new TwistyPlayer({
      puzzle: "3x3x3",
      alg: alg, // Use the solution algorithm here
      hintFacelets: "none",
      background: "none"
    });

    playerContainer.appendChild(player);
  };

  return null;
};


export default App;
