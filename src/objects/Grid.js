import Phaser from 'phaser';
import {
  COLORS, BUBBLE_RADIUS, GRID_OFFSET_X, GRID_OFFSET_Y,
  GRID_COLS, ROW_HEIGHT, GAME_OVER_LINE, CEILING_DROP_AMOUNT
} from '../config/constants.js';

export class Grid {
  constructor(scene, bubblePool) {
    this.scene = scene;
    this.bubblePool = bubblePool;
    this.bubbles = scene.physics.add.group();
    this.grid = []; // 2D array [row][col]
    this.cols = GRID_COLS;
    this.ceilingOffset = 0; // How much the ceiling has dropped
    this.activeColors = new Set(); // Track which colors are still on screen
  }

  initializeFromLevel(levelData) {
    this.clear();
    this.activeColors.clear();

    const { rows } = levelData;

    rows.forEach((rowData, row) => {
      this.grid[row] = [];
      const isOddRow = row % 2 === 1;
      const offset = isOddRow ? BUBBLE_RADIUS : 0;

      rowData.forEach((colorIndex, col) => {
        if (colorIndex >= 0) {
          const x = GRID_OFFSET_X + col * BUBBLE_RADIUS * 2 + offset;
          const y = GRID_OFFSET_Y + row * ROW_HEIGHT + this.ceilingOffset;

          const bubble = this.createBubble(x, y, colorIndex);
          bubble.gridRow = row;
          bubble.gridCol = col;
          this.grid[row][col] = bubble;
          this.activeColors.add(colorIndex);
        } else {
          this.grid[row][col] = null;
        }
      });
    });
  }

  initializeRandom(numRows, numColors) {
    this.clear();
    this.activeColors.clear();

    for (let row = 0; row < numRows; row++) {
      this.grid[row] = [];
      const isOddRow = row % 2 === 1;
      const offset = isOddRow ? BUBBLE_RADIUS : 0;
      const colCount = isOddRow ? this.cols - 1 : this.cols;

      for (let col = 0; col < colCount; col++) {
        const x = GRID_OFFSET_X + col * BUBBLE_RADIUS * 2 + offset;
        const y = GRID_OFFSET_Y + row * ROW_HEIGHT + this.ceilingOffset;
        const colorIndex = Phaser.Math.Between(0, numColors - 1);

        const bubble = this.createBubble(x, y, colorIndex);
        bubble.gridRow = row;
        bubble.gridCol = col;
        this.grid[row][col] = bubble;
        this.activeColors.add(colorIndex);
      }
    }
  }

  createBubble(x, y, colorIndex) {
    const bubble = this.bubblePool.get(x, y, colorIndex);
    bubble.body.setImmovable(true);
    bubble.body.moves = false;
    this.bubbles.add(bubble);
    return bubble;
  }

  clear() {
    this.bubbles.getChildren().forEach(bubble => {
      this.bubblePool.release(bubble);
    });
    this.bubbles.clear(false, false);
    this.grid = [];
    this.ceilingOffset = 0;
  }

  dropCeiling() {
    this.ceilingOffset += CEILING_DROP_AMOUNT;

    // Move all bubbles down
    this.bubbles.getChildren().forEach(bubble => {
      bubble.y += CEILING_DROP_AMOUNT;
      bubble.body.reset(bubble.x, bubble.y);
    });
  }

  addNewRow() {
    // Shift all existing rows down
    const newGrid = [[]];

    // Create new top row
    const offset = 0; // Row 0 is even
    for (let col = 0; col < this.cols; col++) {
      const x = GRID_OFFSET_X + col * BUBBLE_RADIUS * 2 + offset;
      const y = GRID_OFFSET_Y + this.ceilingOffset;

      const colorIndex = this.getRandomActiveColor();
      const bubble = this.createBubble(x, y, colorIndex);
      bubble.gridRow = 0;
      bubble.gridCol = col;
      newGrid[0][col] = bubble;
    }

    // Update existing bubbles' row indices and positions
    this.grid.forEach((row, rowIndex) => {
      newGrid[rowIndex + 1] = [];
      if (row) {
        row.forEach((bubble, col) => {
          if (bubble) {
            bubble.gridRow = rowIndex + 1;
            const isOddRow = (rowIndex + 1) % 2 === 1;
            const offset = isOddRow ? BUBBLE_RADIUS : 0;
            bubble.x = GRID_OFFSET_X + col * BUBBLE_RADIUS * 2 + offset;
            bubble.y = GRID_OFFSET_Y + (rowIndex + 1) * ROW_HEIGHT + this.ceilingOffset;
            bubble.body.reset(bubble.x, bubble.y);
            newGrid[rowIndex + 1][col] = bubble;
          }
        });
      }
    });

    this.grid = newGrid;
  }

  snapToGrid(x, y) {
    const row = Math.max(0, Math.round((y - GRID_OFFSET_Y - this.ceilingOffset) / ROW_HEIGHT));
    const isOddRow = row % 2 === 1;
    const offset = isOddRow ? BUBBLE_RADIUS : 0;
    let col = Math.round((x - GRID_OFFSET_X - offset) / (BUBBLE_RADIUS * 2));

    // Clamp col to valid range
    const maxCol = isOddRow ? this.cols - 2 : this.cols - 1;
    col = Math.max(0, Math.min(col, maxCol));

    const snappedX = GRID_OFFSET_X + col * BUBBLE_RADIUS * 2 + offset;
    const snappedY = GRID_OFFSET_Y + row * ROW_HEIGHT + this.ceilingOffset;

    return { row, col, x: snappedX, y: snappedY };
  }

  addBubble(bubble, row, col) {
    // Ensure row exists
    while (this.grid.length <= row) {
      this.grid.push([]);
    }

    bubble.gridRow = row;
    bubble.gridCol = col;
    this.grid[row][col] = bubble;
    bubble.body.setImmovable(true);
    bubble.body.moves = false;
    this.bubbles.add(bubble);
    this.activeColors.add(bubble.colorIndex);
  }

  removeBubble(bubble) {
    if (bubble.gridRow !== undefined && bubble.gridCol !== undefined) {
      if (this.grid[bubble.gridRow]) {
        this.grid[bubble.gridRow][bubble.gridCol] = null;
      }
    }
    this.bubbles.remove(bubble, false, false);
  }

  findMatches(row, col, colorIndex, visited = new Set()) {
    const key = `${row},${col}`;
    if (visited.has(key)) return [];

    const bubble = this.grid[row]?.[col];
    if (!bubble || bubble.colorIndex !== colorIndex) return [];

    visited.add(key);
    let matches = [bubble];

    const neighbors = this.getNeighbors(row, col);
    for (const [nRow, nCol] of neighbors) {
      matches = matches.concat(this.findMatches(nRow, nCol, colorIndex, visited));
    }

    return matches;
  }

  getNeighbors(row, col) {
    const isOddRow = row % 2 === 1;
    const offsets = isOddRow
      ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
      : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

    return offsets
      .map(([dr, dc]) => [row + dr, col + dc])
      .filter(([r, c]) => r >= 0 && c >= 0 && this.grid[r]?.[c]);
  }

  findFloatingBubbles() {
    const connected = new Set();

    // Find all bubbles connected to top row
    if (this.grid[0]) {
      for (let col = 0; col < this.grid[0].length; col++) {
        if (this.grid[0][col]) {
          this.markConnected(0, col, connected);
        }
      }
    }

    // Return bubbles not connected to top
    const floating = [];
    for (let row = 0; row < this.grid.length; row++) {
      if (!this.grid[row]) continue;
      for (let col = 0; col < this.grid[row].length; col++) {
        const bubble = this.grid[row][col];
        if (bubble && !connected.has(`${row},${col}`)) {
          floating.push(bubble);
        }
      }
    }

    return floating;
  }

  markConnected(row, col, connected) {
    const key = `${row},${col}`;
    if (connected.has(key) || !this.grid[row]?.[col]) return;

    connected.add(key);
    const neighbors = this.getNeighbors(row, col);
    for (const [nRow, nCol] of neighbors) {
      this.markConnected(nRow, nCol, connected);
    }
  }

  updateActiveColors() {
    this.activeColors.clear();
    this.bubbles.getChildren().forEach(bubble => {
      if (bubble.active) {
        this.activeColors.add(bubble.colorIndex);
      }
    });
  }

  getRandomActiveColor() {
    if (this.activeColors.size === 0) {
      return Phaser.Math.Between(0, COLORS.length - 1);
    }
    const colors = Array.from(this.activeColors);
    return Phaser.Math.RND.pick(colors);
  }

  checkGameOver() {
    for (const row of this.grid) {
      if (!row) continue;
      for (const bubble of row) {
        if (bubble && bubble.y >= GAME_OVER_LINE) {
          return true;
        }
      }
    }
    return false;
  }

  checkWin() {
    return this.bubbles.getLength() === 0;
  }

  getBubbleCount() {
    return this.bubbles.getLength();
  }
}
