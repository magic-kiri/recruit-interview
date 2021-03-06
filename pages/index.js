import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Snake.module.css";

const Config = {
  height: 25,
  width: 25,
  cellSize: 32,
  foodLifetime: 10000,
  foodInterval: 3000,
  refreshInterval: 1000,
};

const CellType = {
  Snake: "snake",
  Food: "food",
  Empty: "empty",
};

const Direction = {
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
  Top: { x: 0, y: -1 },
  Bottom: { x: 0, y: 1 },
};

const Cell = ({ x, y, type }) => {
  const getStyles = () => {
    switch (type) {
      case CellType.Snake:
        return {
          backgroundColor: "yellowgreen",
          borderRadius: 8,
          padding: 2,
        };

      case CellType.Food:
        return {
          backgroundColor: "darkorange",
          borderRadius: 20,
          width: 32,
          height: 32,
        };

      default:
        return {};
    }
  };
  return (
    <div
      className={styles.cellContainer}
      style={{
        left: x * Config.cellSize,
        top: y * Config.cellSize,
        width: Config.cellSize,
        height: Config.cellSize,
      }}
    >
      <div className={styles.cell} style={getStyles()}></div>
    </div>
  );
};

const getRandomCell = () => ({
  x: Math.floor(Math.random() * Config.width),
  y: Math.floor(Math.random() * Config.width),
});

// Reappear the snake from the opposite dirrection(Cyclic Rotation)
const getPosition = ({ x, y }) => ({
  x: (x + Config.width) % Config.width,
  y: (y + Config.height) % Config.height,
});

const Snake = () => {
  const getDefaultSnake = () => [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ];
  const grid = useRef();

  // snake[0] is head and snake[snake.length - 1] is tail
  const [snake, setSnake] = useState(getDefaultSnake());
  const [direction, setDirection] = useState(Direction.Right);

  // There can be multiple foods
  const [foods, setFoods] = useState([
    { x: 4, y: 10, arrivalTime: new Date() },
  ]);
  const [score, setScore] = useState(0);

  const resetGame = () => {
    setDirection(Direction.Right);
    setScore(0);
  };

  // move the snake
  useEffect(() => {
    const runSingleStep = () => {
      setSnake((snake) => {
        const head = snake[0];
        const newHead = getPosition({
          x: head.x + direction.x,
          y: head.y + direction.y,
        });
        if (isSnake(newHead)) {
          resetGame();
          return getDefaultSnake();
        }

        // make a new snake by extending head
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        const newSnake = [newHead, ...snake];

        // remove tail

        if (!isFood(newHead)) {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    runSingleStep();
    const timer = setInterval(runSingleStep, 500);

    return () => clearInterval(timer);
  }, [direction, foods]);

  // gives a new available cell for food
  const getNewFood = () => {
    let newFood = getRandomCell();
    while (isSnake(newFood) || isFood(newFood)) {
      newFood = getRandomCell();
    }
    newFood.arrivalTime = new Date();
    return newFood;
  };

  // removes a food from the food list
  const removeFood = ({ x, y }) => {
    setFoods((foods) =>
      foods.filter((food) => !(food.x === x && food.y === y))
    );
  };

  // adds a given food to the food list
  const addFood = (food) => {
    setFoods((foods) => [...foods, food]);
  };

  // update score whenever head touches a food
  useEffect(() => {
    const head = snake[0];
    if (isFood(head)) {
      setScore((score) => {
        return score + 1;
      });

      removeFood(head);
      
    }
  }, [snake]);

  // every 3s a new food will arrive and it will vanish after 10s
  useEffect(() => {
    const createNewFood = () => {
      let newFood = getNewFood();
      addFood(newFood);
    };

    // checks the food list. All foods appeared in the ascending order of their arrival time
    const refreshFood = () => {
      setFoods((prevFoods) => {
        let idx = prevFoods.findIndex((food) => {
          return new Date() - food.arrivalTime < Config.foodLifetime;
        });

        if (idx == -1) return [];
        else if (idx == 0) return prevFoods;
        // Not updating the state
        else return prevFoods.slice(idx); // suffix of the current food list
      });
    };

    const addFoodTimer = setInterval(createNewFood, Config.foodInterval);

    // Every second we will refresh the food list
    const refreshTimer = setInterval(refreshFood, Config.refreshInterval);

    return () => {
      // cleanup
      clearInterval(refreshTimer);
      clearInterval(addFoodTimer);
    };
  }, []);

  // The Snake is unable to turn 180 degree.
  useEffect(() => {
    const handleNavigation = (event) => {
      switch (event.key) {
        case "ArrowUp":
          setDirection((prevDirection) =>
            prevDirection === Direction.Bottom
              ? Direction.Bottom
              : Direction.Top
          );
          break;

        case "ArrowDown":
          setDirection((prevDirection) =>
            prevDirection === Direction.Top ? Direction.Top : Direction.Bottom
          );
          break;

        case "ArrowLeft":
          setDirection((prevDirection) =>
            prevDirection === Direction.Right ? Direction.Right : Direction.Left
          );
          break;

        case "ArrowRight":
          setDirection((prevDirection) =>
            prevDirection === Direction.Left ? Direction.Left : Direction.Right
          );
          break;
      }
    };
    window.addEventListener("keydown", handleNavigation);

    return () => window.removeEventListener("keydown", handleNavigation);
  }, []);

  // ?. is called optional chaining
  // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining

  // checks the entire array
  const isFood = ({ x, y }) =>
    foods.find((food) => food.x === x && food.y === y);

  const isSnake = ({ x, y }) =>
    snake.find((position) => position.x === x && position.y === y);

  const cells = [];
  for (let x = 0; x < Config.width; x++) {
    for (let y = 0; y < Config.height; y++) {
      let type = CellType.Empty;
      if (isFood({ x, y })) {
        type = CellType.Food;
      } else if (isSnake({ x, y })) {
        type = CellType.Snake;
      }
      cells.push(<Cell key={`${x}-${y}`} x={x} y={y} type={type} />);
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{ width: Config.width * Config.cellSize }}
      >
        Score: {score}
      </div>
      <div
        className={styles.grid}
        style={{
          height: Config.height * Config.cellSize,
          width: Config.width * Config.cellSize,
        }}
      >
        {cells}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Snake), {
  ssr: false,
});