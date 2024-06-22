import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GithubIcon, Play, User } from 'lucide-react';

const CANVAS_SIZE = [800, 600];
const SNAKE_START = [[8, 7], [8, 8]];
const APPLE_START = [8, 3];
const SCALE = 40;
const SPEED = 100;
const DIRECTIONS = {
  38: [0, -1], // up
  40: [0, 1], // down
  37: [-1, 0], // left
  39: [1, 0] // right
};

class SnakeAI {
  constructor(boardWidth, boardHeight) {
    this.boardWidth = boardWidth;
    this.boardHeight = boardHeight;
  }

  findPath(snake, apple) {
    const start = snake[0];
    const goal = apple;
    const heap = [[this.heuristic(start, goal), start]];
    const cameFrom = {};
    const gScore = { [start]: 0 };
    const fScore = { [start]: this.heuristic(start, goal) };

    while (heap.length > 0) {
      const current = heap.shift()[1];

      if (current[0] === goal[0] && current[1] === goal[1]) {
        return this.reconstructPath(cameFrom, current);
      }

      for (const neighbor of this.getNeighbors(current)) {
        if (snake.slice(0, -1).some(s => s[0] === neighbor[0] && s[1] === neighbor[1])) {
          continue;
        }

        const tentativeGScore = gScore[current] + 1;

        if (!(neighbor in gScore) || tentativeGScore < gScore[neighbor]) {
          cameFrom[neighbor] = current;
          gScore[neighbor] = tentativeGScore;
          fScore[neighbor] = gScore[neighbor] + this.heuristic(neighbor, goal);
          heap.push([fScore[neighbor], neighbor]);
          heap.sort((a, b) => a[0] - b[0]);
        }
      }
    }

    return null;
  }

  heuristic(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  getNeighbors(pos) {
    const [x, y] = pos;
    return [
      [(x + 1) % this.boardWidth, y],
      [(x - 1 + this.boardWidth) % this.boardWidth, y],
      [x, (y + 1) % this.boardHeight],
      [x, (y - 1 + this.boardHeight) % this.boardHeight]
    ];
  }

  reconstructPath(cameFrom, current) {
    const path = [current];
    while (current in cameFrom) {
      current = cameFrom[current];
      path.unshift(current);
    }
    return path;
  }

  getNextMove(snake, apple) {
    const path = this.findPath(snake, apple);
    if (path && path.length > 1) {
      const nextPos = path[1];
      const head = snake[0];
      if (nextPos[0] > head[0] || (nextPos[0] === 0 && head[0] === this.boardWidth - 1)) return 39; // RIGHT
      if (nextPos[0] < head[0] || (nextPos[0] === this.boardWidth - 1 && head[0] === 0)) return 37; // LEFT
      if (nextPos[1] > head[1] || (nextPos[1] === 0 && head[1] === this.boardHeight - 1)) return 40; // DOWN
      if (nextPos[1] < head[1] || (nextPos[1] === this.boardHeight - 1 && head[1] === 0)) return 38; // UP
    }
    
    // If no path is found, try to move in a safe direction
    for (const direction of [38, 40, 37, 39]) {
      const nextPos = this.getNextPosition(snake[0], direction);
      if (!snake.slice(0, -1).some(s => s[0] === nextPos[0] && s[1] === nextPos[1])) {
        return direction;
      }
    }
    
    return 38; // UP (default move if no safe move is found)
  }

  getNextPosition(head, direction) {
    const [x, y] = head;
    switch (direction) {
      case 38: return [x, (y - 1 + this.boardHeight) % this.boardHeight]; // UP
      case 40: return [x, (y + 1) % this.boardHeight]; // DOWN
      case 37: return [(x - 1 + this.boardWidth) % this.boardWidth, y]; // LEFT
      case 39: return [(x + 1) % this.boardWidth, y]; // RIGHT
      default: return head;
    }
  }
}

const SnakeGame = () => {
  const canvasRef = useRef();
  const [snake, setSnake] = useState(SNAKE_START);
  const [apple, setApple] = useState(APPLE_START);
  const [dir, setDir] = useState([0, -1]);
  const [speed, setSpeed] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isComputerPlaying, setIsComputerPlaying] = useState(false);

  const ai = useRef(new SnakeAI(CANVAS_SIZE[0] / SCALE, CANVAS_SIZE[1] / SCALE));

  useInterval(() => gameLoop(), speed);

  const endGame = () => {
    setSpeed(null);
    setGameOver(true);
  };

  const moveSnake = useCallback(({ keyCode }) => {
    if (keyCode >= 37 && keyCode <= 40) {
      setDir(DIRECTIONS[keyCode]);
    }
  }, []);

  const createApple = () =>
    apple.map((_a, i) => Math.floor(Math.random() * (CANVAS_SIZE[i] / SCALE)));

  const checkCollision = (piece, snk = snake) => {
    for (const segment of snk.slice(1)) {
      if (piece[0] === segment[0] && piece[1] === segment[1]) return true;
    }
    return false;
  };

  const checkAppleCollision = newSnake => {
    if (newSnake[0][0] === apple[0] && newSnake[0][1] === apple[1]) {
      let newApple = createApple();
      while (checkCollision(newApple, newSnake)) {
        newApple = createApple();
      }
      setApple(newApple);
      setScore(score + 1);
      return true;
    }
    return false;
  };

  const gameLoop = () => {
    const snakeCopy = JSON.parse(JSON.stringify(snake));
    const newSnakeHead = [
      (snakeCopy[0][0] + dir[0] + CANVAS_SIZE[0] / SCALE) % (CANVAS_SIZE[0] / SCALE),
      (snakeCopy[0][1] + dir[1] + CANVAS_SIZE[1] / SCALE) % (CANVAS_SIZE[1] / SCALE)
    ];
    snakeCopy.unshift(newSnakeHead);
    if (checkCollision(newSnakeHead)) endGame();
    if (!checkAppleCollision(snakeCopy)) snakeCopy.pop();
    setSnake(snakeCopy);

    if (isComputerPlaying) {
      const nextMove = ai.current.getNextMove(snakeCopy, apple);
      setDir(DIRECTIONS[nextMove]);
    }
  };

  const startGame = (computerPlay = false) => {
    setSnake(SNAKE_START);
    setApple(APPLE_START);
    setDir([0, -1]);
    setSpeed(SPEED);
    setGameOver(false);
    setScore(0);
    setIsComputerPlaying(computerPlay);
    canvasRef.current.focus();
  };

  useEffect(() => {
    const context = canvasRef.current.getContext("2d");
    context.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.fillStyle = "#4a9c6d";
    snake.forEach(([x, y]) => context.fillRect(x, y, 1, 1));
    context.fillStyle = "#e74c3c";
    context.fillRect(apple[0], apple[1], 1, 1);
  }, [snake, apple, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isComputerPlaying && DIRECTIONS[e.keyCode]) {
        e.preventDefault();
        moveSnake(e);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isComputerPlaying, moveSnake]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-4">Snake Game</h1>
      <canvas
        className="border-4 border-green-500 rounded-lg"
        ref={canvasRef}
        width={`${CANVAS_SIZE[0]}px`}
        height={`${CANVAS_SIZE[1]}px`}
        tabIndex="0"
      />
      <div className="mt-4 text-xl">Score: {score}</div>
      {gameOver && <div className="mt-2 text-2xl text-red-500">GAME OVER!</div>}
      <div className="mt-4 flex space-x-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
          onClick={() => startGame(false)}
        >
          <User className="mr-2" size={20} />
          Human Play
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center"
          onClick={() => startGame(true)}
        >
          <Play className="mr-2" size={20} />
          Computer Play
        </button>
      </div>
      <div className="mt-4 text-sm">
        {isComputerPlaying ? "Computer is playing" : "Use arrow keys to control the snake"}
      </div>
      <div className="mt-8 text-sm text-gray-400 flex items-center">
        <GithubIcon className="mr-2" size={16} />
        <a href="https://github.com/your-username/snake-game" target="_blank" rel="noopener noreferrer">
          View source on GitHub
        </a>
      </div>
    </div>
  );
};

function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default SnakeGame;
