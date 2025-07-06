const choiceButtons = document.getElementsByClassName("buttons");
const result = document.getElementById("result");
const winStats = document.getElementById("win-stats");
const scoreStats = document.getElementById("score-stats");

const MEMORY_LIMIT = 15;
const PATTERN_CONFIDENCE_MARGIN = 2;

let score = 0;
let maxScore = 0;
let games = 0;
let wins = 0;
let losses = 0;
let draws = 0;
let winner = "";
let p1 = "";
let p2 = "";

let lastPlayerMove = null;
let lastBotMove = null;
let lastResult = null;

const moveHistory = [];
const transitionQueue = [];
const patternArray = {};

const compChoice = {
  0: "rock",
  1: "paper",
  2: "scissors",
};

const winsAgainst = {
  rock: "paper",
  paper: "scissors",
  scissors: "rock",
};

const losesAgainst = {
  rock: "scissors",
  paper: "rock",
  scissors: "paper",
};

for (let button of choiceButtons) {
  button.addEventListener("click", (e) => {
    p2 = smartChoice();
    console.log(`Bot chose: ${p2}`);

    p1 = e.target.id;
    console.log(`Player chose: ${p1}`);

    winner = winCalc(p1, p2);
    result.textContent = winner;
    winStats.textContent = `Wins: ${wins} | Losses: ${losses} | Ties: ${draws} | Games played: ${games}`;
    scoreStats.textContent = `Score: ${score} | High score: ${maxScore}`;

    updatePatternArray(lastPlayerMove, p1);

    moveHistory.push(p1);
    if (moveHistory.length > 10) moveHistory.shift();

    lastPlayerMove = p1;
    lastBotMove = p2;

    console.log("Move history:", moveHistory);
  });
}

function updatePatternArray(prev, curr) {
  if (!prev) return;

  if (!patternArray[prev]) {
    patternArray[prev] = { rock: 0, paper: 0, scissors: 0 };
  }

  patternArray[prev][curr]++;
  transitionQueue.push([prev, curr]);

  if (transitionQueue.length > MEMORY_LIMIT) {
    const [oldPrev, oldCurr] = transitionQueue.shift();
    if (patternArray[oldPrev]) {
      patternArray[oldPrev][oldCurr]--;
    }
  }
}

// === Pattern PREDICTION ===
function predictNextMove(lastMove) {
  if (!lastMove || !patternArray[lastMove]) return null;

  const freqs = patternArray[lastMove];
  const entries = Object.entries(freqs).sort((a, b) => b[1] - a[1]);

  const [topMove, topCount] = entries[0];
  const [, secondCount] = entries[1];

  const margin = topCount - secondCount;

  if (margin >= PATTERN_CONFIDENCE_MARGIN) {
    console.log(`Pattern confidence OK: ${topMove} (${topCount}) > next (${secondCount})`);
    return topMove;
  }

  console.log(`Pattern confidence too low: ${topCount} vs ${secondCount}, fallback triggered`);
  return null;
}

// === SMART BOT LOGIC ===
function smartChoice() {
  // Strategy 1: pattern recognition (only if confident)
  const predictedMove = predictNextMove(lastPlayerMove);
  if (predictedMove) {
    const counter = winsAgainst[predictedMove];
    console.log(`Using Pattern prediction. Predicting player will play ${predictedMove}. Countering with ${counter}`);
    return counter;
  }

  // Strategy 2: Win-stay / lose-shift
  if (lastResult && lastBotMove) {
    if (lastResult === "lose") {
      const expected = winsAgainst[lastBotMove];
      const counter = winsAgainst[expected];
      console.log(`Using lose-shift heuristic. Expecting ${expected}. Playing ${counter}`);
      return counter;
    } else if (lastResult === "win") {
      const expected = lastPlayerMove;
      const counter = winsAgainst[expected];
      console.log(`Using win-stay heuristic. Expecting repeat ${expected}. Playing ${counter}`);
      return counter;
    }
  }

  // Strategy 3: Fallback random
  const options = ['rock', 'paper', 'scissors'];
  const move = options[Math.floor(Math.random() * 3)];
  console.log("Using fallback random strategy:", move);
  return move;
}

// resullts calculator
function winCalc(p1, p2) {
  let temp = "";

  if (p2 === winsAgainst[p1]) {
    losses++;
    score--;
    temp = `I chose ${p2}! You lose!`;
    lastResult = "lose";
  } else if (p1 === winsAgainst[p2]) {
    wins++;
    score++;
    temp = `I chose ${p2}, You win this time...`;
    lastResult = "win";
  } else {
    draws++;
    temp = `I chose ${p2} as well! It's a draw!`;
    lastResult = "draw";
  }

  if (score > maxScore || maxScore === null) {
    maxScore = score;
  }

  games++;
  return temp;
}
