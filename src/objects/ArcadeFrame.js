import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, THEME,
  PLAYFIELD_LEFT, PLAYFIELD_RIGHT, PLAYFIELD_TOP, PLAYFIELD_BOTTOM
} from '../config/constants.js';

export class ArcadeFrame {
  constructor(scene) {
    this.scene = scene;
    this.createBackground();
    this.createSidePanels();
    this.createPlayfieldBackground();
    this.createFrame();
    this.createCeilingBar();
  }

  createBackground() {
    // Dark base background
    const bg = this.scene.add.graphics();
    bg.setDepth(-20);
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  createPlayfieldBackground() {
    const bg = this.scene.add.graphics();
    bg.setDepth(-10);

    // Purple/magenta gradient for playfield area
    const steps = 15;
    const startColor = Phaser.Display.Color.IntegerToColor(0x2a0845);
    const endColor = Phaser.Display.Color.IntegerToColor(0x6a1b9a);

    for (let i = 0; i < steps; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        startColor, endColor, steps, i
      );
      const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

      const y = PLAYFIELD_TOP + ((PLAYFIELD_BOTTOM - PLAYFIELD_TOP) / steps) * i;
      const h = (PLAYFIELD_BOTTOM - PLAYFIELD_TOP) / steps + 1;

      bg.fillStyle(hexColor, 1);
      bg.fillRect(PLAYFIELD_LEFT, y, PLAYFIELD_RIGHT - PLAYFIELD_LEFT, h);
    }

    // Grid pattern overlay
    const grid = this.scene.add.graphics();
    grid.setDepth(-9);
    grid.lineStyle(1, 0x5a3080, 0.4);

    // Vertical lines
    for (let x = PLAYFIELD_LEFT; x <= PLAYFIELD_RIGHT; x += 20) {
      grid.lineBetween(x, PLAYFIELD_TOP, x, PLAYFIELD_BOTTOM);
    }

    // Horizontal lines
    for (let y = PLAYFIELD_TOP; y <= PLAYFIELD_BOTTOM; y += 20) {
      grid.lineBetween(PLAYFIELD_LEFT, y, PLAYFIELD_RIGHT, y);
    }
  }

  createSidePanels() {
    // Left panel
    this.createTechPanel(0, 0, PLAYFIELD_LEFT, GAME_HEIGHT, true);
    // Right panel
    this.createTechPanel(PLAYFIELD_RIGHT, 0, GAME_WIDTH - PLAYFIELD_RIGHT, GAME_HEIGHT, false);
  }

  createTechPanel(x, y, width, height, isLeft) {
    const panel = this.scene.add.graphics();
    panel.setDepth(-5);

    // Dark blue base
    panel.fillStyle(0x0d1b3d, 1);
    panel.fillRect(x, y, width, height);

    // Decorative tech rectangles
    const rectColor = 0x1a3366;
    const highlightColor = 0x2a4a80;

    // Large decorative rectangles
    const rects = isLeft ? [
      { rx: 5, ry: 80, rw: 30, rh: 60 },
      { rx: 5, ry: 160, rw: 30, rh: 80 },
      { rx: 5, ry: 260, rw: 30, rh: 60 },
      { rx: 5, ry: 340, rw: 30, rh: 100 },
      { rx: 5, ry: 460, rw: 30, rh: 60 },
    ] : [
      { rx: 5, ry: 80, rw: 30, rh: 60 },
      { rx: 5, ry: 160, rw: 30, rh: 80 },
      { rx: 5, ry: 260, rw: 30, rh: 60 },
      { rx: 5, ry: 340, rw: 30, rh: 100 },
      { rx: 5, ry: 460, rw: 30, rh: 60 },
    ];

    rects.forEach(r => {
      const rx = isLeft ? x + r.rx : x + r.rx;

      // Outer rectangle
      panel.fillStyle(rectColor, 1);
      panel.fillRect(rx, r.ry, r.rw, r.rh);

      // Inner highlight
      panel.fillStyle(highlightColor, 1);
      panel.fillRect(rx + 3, r.ry + 3, r.rw - 6, r.rh - 6);

      // Inner dark
      panel.fillStyle(0x0a1428, 1);
      panel.fillRect(rx + 6, r.ry + 6, r.rw - 12, r.rh - 12);

      // Glowing lines
      panel.lineStyle(1, 0x4080c0, 0.6);
      panel.strokeRect(rx + 2, r.ry + 2, r.rw - 4, r.rh - 4);
    });

    // Small indicator lights
    const lights = [120, 200, 300, 400, 500];
    lights.forEach((ly, i) => {
      const lx = isLeft ? x + 18 : x + 18;
      const color = i % 2 === 0 ? 0x00ff88 : 0xff6600;

      panel.fillStyle(color, 0.8);
      panel.fillCircle(lx, ly, 4);

      // Glow
      panel.fillStyle(color, 0.3);
      panel.fillCircle(lx, ly, 8);
    });

    // Circuit line decorations
    panel.lineStyle(1, 0x3060a0, 0.5);
    const cx = isLeft ? x + 20 : x + 20;

    for (let cy = 60; cy < height - 100; cy += 80) {
      // Horizontal line
      panel.lineBetween(cx - 10, cy, cx + 10, cy);
      // Vertical connector
      panel.lineBetween(cx, cy, cx, cy + 40);
      // Node dot
      panel.fillStyle(0x4080c0, 0.8);
      panel.fillCircle(cx, cy, 3);
    }
  }

  createFrame() {
    const frame = this.scene.add.graphics();
    frame.setDepth(50);

    // Main cyan/teal frame border - multiple layers for depth
    // Outer dark border
    frame.lineStyle(4, 0x006b8f, 1);
    frame.strokeRect(PLAYFIELD_LEFT - 4, PLAYFIELD_TOP - 4,
      PLAYFIELD_RIGHT - PLAYFIELD_LEFT + 8, PLAYFIELD_BOTTOM - PLAYFIELD_TOP + 8);

    // Main bright border
    frame.lineStyle(3, 0x00D9FF, 1);
    frame.strokeRect(PLAYFIELD_LEFT - 1, PLAYFIELD_TOP - 1,
      PLAYFIELD_RIGHT - PLAYFIELD_LEFT + 2, PLAYFIELD_BOTTOM - PLAYFIELD_TOP + 2);

    // Inner highlight
    frame.lineStyle(1, 0x00D9FF, 0.6);
    frame.strokeRect(PLAYFIELD_LEFT + 1, PLAYFIELD_TOP + 1,
      PLAYFIELD_RIGHT - PLAYFIELD_LEFT - 2, PLAYFIELD_BOTTOM - PLAYFIELD_TOP - 2);

    // Corner decorations
    this.createCornerDecoration(frame, PLAYFIELD_LEFT, PLAYFIELD_TOP, 1, 1);
    this.createCornerDecoration(frame, PLAYFIELD_RIGHT, PLAYFIELD_TOP, -1, 1);
    this.createCornerDecoration(frame, PLAYFIELD_LEFT, PLAYFIELD_BOTTOM, 1, -1);
    this.createCornerDecoration(frame, PLAYFIELD_RIGHT, PLAYFIELD_BOTTOM, -1, -1);

    // Bottom launcher area background
    frame.fillStyle(0x0a0a2a, 0.95);
    frame.fillRect(PLAYFIELD_LEFT, PLAYFIELD_BOTTOM + 2,
      PLAYFIELD_RIGHT - PLAYFIELD_LEFT, GAME_HEIGHT - PLAYFIELD_BOTTOM - 2);

    // Bottom area border
    frame.lineStyle(2, 0x00D9FF, 0.8);
    frame.lineBetween(PLAYFIELD_LEFT, PLAYFIELD_BOTTOM + 2, PLAYFIELD_RIGHT, PLAYFIELD_BOTTOM + 2);
  }

  createCornerDecoration(graphics, x, y, dx, dy) {
    const size = 12;

    graphics.fillStyle(0x00D9FF, 1);
    graphics.fillRect(x - (dx > 0 ? 0 : size), y - (dy > 0 ? 0 : size), size, size);

    graphics.fillStyle(0x006666, 1);
    graphics.fillRect(
      x - (dx > 0 ? -2 : size - 2),
      y - (dy > 0 ? -2 : size - 2),
      size - 4, size - 4
    );
  }

  createCeilingBar() {
    const ceiling = this.scene.add.graphics();
    ceiling.setDepth(55);

    // Metallic ceiling bar
    ceiling.fillStyle(0x404060, 1);
    ceiling.fillRect(PLAYFIELD_LEFT, PLAYFIELD_TOP - 8, PLAYFIELD_RIGHT - PLAYFIELD_LEFT, 10);

    // Highlight
    ceiling.fillStyle(0x606080, 1);
    ceiling.fillRect(PLAYFIELD_LEFT, PLAYFIELD_TOP - 8, PLAYFIELD_RIGHT - PLAYFIELD_LEFT, 3);

    // Bottom edge shadow
    ceiling.fillStyle(0x202040, 1);
    ceiling.fillRect(PLAYFIELD_LEFT, PLAYFIELD_TOP, PLAYFIELD_RIGHT - PLAYFIELD_LEFT, 2);

    // Bolts/rivets
    ceiling.fillStyle(0x808090, 1);
    for (let bx = PLAYFIELD_LEFT + 20; bx < PLAYFIELD_RIGHT - 10; bx += 40) {
      ceiling.fillCircle(bx, PLAYFIELD_TOP - 3, 3);
    }
  }
}
