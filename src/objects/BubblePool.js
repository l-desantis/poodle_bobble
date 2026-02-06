import Phaser from 'phaser';
import { BUBBLE_RADIUS, COLORS } from '../config/constants.js';

export class BubblePool {
  constructor(scene, initialSize = 100) {
    this.scene = scene;
    this.pool = [];
    this.active = new Set();

    // Pre-create bubbles
    for (let i = 0; i < initialSize; i++) {
      this.createBubble();
    }
  }

  createBubble() {
    const bubble = this.scene.add.image(0, 0, 'bubble_0');
    bubble.setActive(false);
    bubble.setVisible(false);
    this.scene.physics.add.existing(bubble);
    bubble.body.setCircle(BUBBLE_RADIUS - 2);
    this.pool.push(bubble);
    return bubble;
  }

  get(x, y, colorIndex) {
    let bubble = this.pool.find(b => !b.active);

    if (!bubble) {
      bubble = this.createBubble();
    }

    bubble.setTexture(`bubble_${colorIndex}`);
    bubble.setPosition(x, y);
    bubble.setActive(true);
    bubble.setVisible(true);
    bubble.setScale(1);
    bubble.setAlpha(1);
    bubble.colorIndex = colorIndex;
    bubble.gridRow = undefined;
    bubble.gridCol = undefined;

    bubble.body.reset(x, y);
    bubble.body.setCircle(BUBBLE_RADIUS - 2);

    this.active.add(bubble);

    return bubble;
  }

  release(bubble) {
    bubble.setActive(false);
    bubble.setVisible(false);
    bubble.body.setVelocity(0, 0);
    bubble.body.setImmovable(false);
    bubble.body.moves = true;
    this.active.delete(bubble);
  }

  releaseAll() {
    this.active.forEach(bubble => {
      bubble.setActive(false);
      bubble.setVisible(false);
      bubble.body.setVelocity(0, 0);
    });
    this.active.clear();
  }

  getActiveCount() {
    return this.active.size;
  }
}
