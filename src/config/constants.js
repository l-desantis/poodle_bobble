// Arcade-style bubble colors (vibrant, saturated)
export const COLORS = [
  0xff3333, // Red
  0x33ff33, // Green
  0x3399ff, // Blue
  0xffff33, // Yellow
  0xff33ff, // Pink/Magenta
  0xff9933, // Orange
];

export const COLOR_NAMES = ['red', 'green', 'blue', 'yellow', 'pink', 'orange'];

// Bubble size
export const BUBBLE_RADIUS = 18;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;

// Grid positioning
export const GRID_COLS = 8;
export const GRID_OFFSET_X = 58;
export const GRID_OFFSET_Y = 70;
export const ROW_HEIGHT = BUBBLE_RADIUS * 1.73;

// Game dimensions
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;

// Playfield bounds
export const PLAYFIELD_LEFT = 40;
export const PLAYFIELD_RIGHT = 440;
export const PLAYFIELD_TOP = 50;
export const PLAYFIELD_BOTTOM = 540;

// Launcher
export const LAUNCHER_X = GAME_WIDTH / 2;
export const LAUNCHER_Y = 570;
export const BUBBLE_SPEED = 900;

// Gameplay
export const IDLE_SHOOT_TIME = 10000;
export const SHOTS_BEFORE_DROP = 8;
export const CEILING_DROP_AMOUNT = ROW_HEIGHT;
export const GAME_OVER_LINE = 500;

// Scoring
export const SCORE_BASE_MATCH = 30;
export const SCORE_EXTRA_BUBBLE = 20;
export const SCORE_FLOATING = 100;

// Lives
export const MAX_LIVES = 5;

// Physics
export const WORLD_BOUNDS_TOP = 50;

// Visual theme colors (arcade style)
export const THEME = {
  // Backgrounds
  bgDark: 0x1a0a2e,
  bgMid: 0x4A148C,
  bgLight: 0x7B1FA2,

  // Frame/borders
  frameCyan: 0x00D9FF,
  frameGreen: 0x00ff88,
  framePink: 0xE91E63,

  // Accents
  accentPurple: 0x7B1FA2,
  accentMagenta: 0xE91E63,

  // UI
  textYellow: 0xFFEB3B,
  textWhite: 0xffffff,
  dangerRed: 0xff3333,
};

// Typography
export const FONT_FAMILY = "'Press Start 2P', 'Courier New', monospace";
export const FONT_FAMILY_UI = "'Press Start 2P', monospace";
