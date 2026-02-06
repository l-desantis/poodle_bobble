import Phaser from 'phaser';
import {
  BUBBLE_RADIUS, BUBBLE_SPEED, LAUNCHER_X, LAUNCHER_Y,
  PLAYFIELD_LEFT, PLAYFIELD_RIGHT, PLAYFIELD_TOP, THEME
} from '../config/constants.js';

export class Launcher {
  constructor(scene, bubblePool) {
    this.scene = scene;
    this.bubblePool = bubblePool;
    this.x = LAUNCHER_X;
    this.y = LAUNCHER_Y;
    this.angle = -90;
    this.canShoot = false;
    this.loadedBubble = null;
    this.currentColorIndex = 0;

    this.createAimLine();
  }

  createAimLine() {
    // Trajectory preview dots - fading cyan
    this.trajectoryDots = [];
    for (let i = 0; i < 20; i++) {
      const dot = this.scene.add.circle(0, 0, 2.5, 0x00D9FF, 0.7);
      dot.setVisible(false);
      dot.setDepth(10);
      this.trajectoryDots.push(dot);
    }
  }

  loadBubble(colorIndex) {
    if (this.loadedBubble) {
      this.bubblePool.release(this.loadedBubble);
    }

    this.currentColorIndex = colorIndex;
    this.loadedBubble = this.bubblePool.get(this.x, this.y - 25, colorIndex);
    this.loadedBubble.setDepth(23);

    // Don't set physics until shooting - bubble stays static while loaded
    this.loadedBubble.body.moves = false;

    // Pop-in animation
    this.loadedBubble.setScale(0);
    this.scene.tweens.add({
      targets: this.loadedBubble,
      scale: 1,
      duration: 150,
      ease: 'Back.easeOut'
    });

    this.canShoot = true;
  }

  aimAt(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    this.angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Clamp angle to prevent shooting downward
    if (this.angle > -10) this.angle = -10;
    if (this.angle < -170) this.angle = -170;

    // Update trajectory
    this.updateTrajectory();
  }

  updateTrajectory() {
    const radians = this.angle * (Math.PI / 180);
    let x = this.x;
    let y = this.y - 25;
    let vx = Math.cos(radians);
    let vy = Math.sin(radians);

    const stepSize = 22;
    let dotsShown = 0;

    for (let i = 0; i < this.trajectoryDots.length; i++) {
      x += vx * stepSize;
      y += vy * stepSize;

      // Bounce off walls
      if (x < PLAYFIELD_LEFT + BUBBLE_RADIUS) {
        x = PLAYFIELD_LEFT + BUBBLE_RADIUS;
        vx = -vx;
      } else if (x > PLAYFIELD_RIGHT - BUBBLE_RADIUS) {
        x = PLAYFIELD_RIGHT - BUBBLE_RADIUS;
        vx = -vx;
      }

      // Stop at ceiling
      if (y < PLAYFIELD_TOP + BUBBLE_RADIUS) {
        this.trajectoryDots[i].setVisible(false);
        continue;
      }

      this.trajectoryDots[i].setPosition(x, y);
      this.trajectoryDots[i].setVisible(true);

      // Fade and shrink
      const alpha = 0.7 - (i / this.trajectoryDots.length) * 0.6;
      const scale = 1 - (i / this.trajectoryDots.length) * 0.4;
      this.trajectoryDots[i].setAlpha(alpha);
      this.trajectoryDots[i].setScale(scale);

      dotsShown++;

      if (y <= PLAYFIELD_TOP + BUBBLE_RADIUS) break;
    }

    // Hide remaining dots
    for (let i = dotsShown; i < this.trajectoryDots.length; i++) {
      this.trajectoryDots[i].setVisible(false);
    }
  }

  shoot() {
    if (!this.canShoot || !this.loadedBubble) return null;

    this.canShoot = false;
    const bubble = this.loadedBubble;
    this.loadedBubble = null;

    // Position bubble and enable physics
    bubble.setPosition(this.x, this.y - 25);
    bubble.body.reset(this.x, this.y - 25);
    bubble.body.moves = true;
    bubble.body.setImmovable(false);
    bubble.body.setCollideWorldBounds(true, 1, 0);
    bubble.body.onWorldBounds = true;

    const radians = this.angle * (Math.PI / 180);
    const vx = Math.cos(radians) * BUBBLE_SPEED;
    const vy = Math.sin(radians) * BUBBLE_SPEED;

    bubble.body.setVelocity(vx, vy);

    // Hide trajectory
    this.hideTrajectory();

    return bubble;
  }

  hideTrajectory() {
    this.trajectoryDots.forEach(dot => dot.setVisible(false));
  }

  destroy() {
    if (this.loadedBubble) {
      this.bubblePool.release(this.loadedBubble);
    }
    this.trajectoryDots.forEach(dot => dot.destroy());
  }
}
