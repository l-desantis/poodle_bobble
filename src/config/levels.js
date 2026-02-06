// Level configurations
// Each level defines the starting bubble pattern
// Numbers represent color indices (0-5), -1 means empty

export const LEVELS = [
  // Level 1 - Simple introduction
  {
    rows: [
      [0, 1, 2, 3, 0, 1, 2, 3],
      [1, 2, 3, 0, 1, 2, 3],
      [2, 3, 0, 1, 2, 3, 0, 1],
      [3, 0, 1, 2, 3, 0, 1],
    ],
    colors: 4, // Only use first 4 colors
  },
  // Level 2
  {
    rows: [
      [0, 0, 1, 1, 2, 2, 3, 3],
      [0, 1, 1, 2, 2, 3, 3],
      [1, 1, 2, 2, 3, 3, 0, 0],
      [1, 2, 2, 3, 3, 0, 0],
      [2, 2, 3, 3, 0, 0, 1, 1],
    ],
    colors: 4,
  },
  // Level 3
  {
    rows: [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [2, 3, 2, 3, 2, 3, 2],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [2, 3, 2, 3, 2, 3, 2],
      [4, 4, 4, 4, 4, 4, 4, 4],
    ],
    colors: 5,
  },
  // Level 4 - Diamond pattern
  {
    rows: [
      [-1, -1, -1, 0, 0, -1, -1, -1],
      [-1, -1, 1, 1, 1, -1, -1],
      [-1, 2, 2, 2, 2, 2, -1, -1],
      [3, 3, 3, 3, 3, 3, 3],
      [-1, 2, 2, 2, 2, 2, -1, -1],
      [-1, -1, 1, 1, 1, -1, -1],
    ],
    colors: 4,
  },
  // Level 5
  {
    rows: [
      [0, 0, 0, 0, 1, 1, 1, 1],
      [0, 0, 0, 1, 1, 1, 1],
      [2, 2, 2, 2, 3, 3, 3, 3],
      [2, 2, 2, 3, 3, 3, 3],
      [4, 4, 4, 4, 5, 5, 5, 5],
      [4, 4, 4, 5, 5, 5, 5],
    ],
    colors: 6,
  },
  // Level 6 - Stripes
  {
    rows: [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5],
    ],
    colors: 6,
  },
  // Level 7 - Checkerboard
  {
    rows: [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1],
    ],
    colors: 2,
  },
  // Level 8 - Arrow
  {
    rows: [
      [-1, -1, -1, 0, 0, -1, -1, -1],
      [-1, -1, 0, 0, 0, -1, -1],
      [-1, 0, 1, 0, 0, 1, -1, -1],
      [0, 1, 1, 0, 0, 1, 1],
      [-1, -1, 1, 0, 0, 1, -1, -1],
      [-1, -1, -1, 0, 0, -1, -1],
      [-1, -1, -1, 0, 0, -1, -1, -1],
    ],
    colors: 2,
  },
  // Level 9
  {
    rows: [
      [0, 1, 2, 3, 4, 5, 0, 1],
      [1, 2, 3, 4, 5, 0, 1],
      [2, 3, 4, 5, 0, 1, 2, 3],
      [3, 4, 5, 0, 1, 2, 3],
      [4, 5, 0, 1, 2, 3, 4, 5],
      [5, 0, 1, 2, 3, 4, 5],
    ],
    colors: 6,
  },
  // Level 10 - Heart
  {
    rows: [
      [-1, 0, 0, -1, -1, 0, 0, -1],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [-1, 0, 0, 0, 0, 0, -1, -1],
      [-1, -1, 0, 0, 0, -1, -1],
      [-1, -1, -1, 0, -1, -1, -1, -1],
    ],
    colors: 1,
  },
  // Levels 11-30: Generate procedurally with increasing difficulty
  ...generateProceduralLevels(11, 30),
];

function generateProceduralLevels(startLevel, endLevel) {
  const levels = [];

  for (let i = startLevel; i <= endLevel; i++) {
    const numRows = Math.min(4 + Math.floor((i - 10) / 3), 8);
    const numColors = Math.min(2 + Math.floor(i / 5), 6);
    const rows = [];

    for (let r = 0; r < numRows; r++) {
      const isOddRow = r % 2 === 1;
      const colCount = isOddRow ? 7 : 8;
      const row = [];

      for (let c = 0; c < colCount; c++) {
        // Create patterns based on level
        if (i % 3 === 0) {
          // Diagonal pattern
          row.push((r + c) % numColors);
        } else if (i % 3 === 1) {
          // Cluster pattern
          row.push(Math.floor(c / 2) % numColors);
        } else {
          // Random with some structure
          row.push(Math.floor(Math.random() * numColors));
        }
      }
      rows.push(row);
    }

    levels.push({ rows, colors: numColors });
  }

  return levels;
}

export function getLevel(levelNum) {
  const index = Math.min(levelNum - 1, LEVELS.length - 1);
  return LEVELS[index];
}
