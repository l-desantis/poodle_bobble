import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, MAX_LIVES, THEME, SHOTS_BEFORE_DROP,
  PLAYFIELD_LEFT, PLAYFIELD_RIGHT, PLAYFIELD_BOTTOM, LAUNCHER_X,
  FONT_FAMILY
} from '../config/constants.js';

export class UI {
  constructor(scene) {
    this.scene = scene;
    this.pushBubbles = [];

    this.createScoreDisplay();
    this.createNextBubbleDisplay();
    this.createPushMeter();
    this.createRoundDisplay();
  }

  createScoreDisplay() {
    // Score at top left - arcade style digital display
    const scoreBox = this.scene.add.graphics();
    scoreBox.setDepth(60);
    scoreBox.fillStyle(0x000000, 0.8);
    scoreBox.fillRect(2, 2, 76, 22);
    scoreBox.lineStyle(1, 0x00D9FF, 0.8);
    scoreBox.strokeRect(2, 2, 76, 22);

    this.scoreText = this.scene.add.text(6, 5, '00000000', {
      fontSize: '10px',
      fontFamily: FONT_FAMILY,
      fill: '#00ffaa',
    });
    this.scoreText.setDepth(61);
  }

  createNextBubbleDisplay() {
    // NEXT bubble display - bottom left like in original
    const nextX = PLAYFIELD_LEFT + 40;
    const nextY = PLAYFIELD_BOTTOM + 50;

    // Box background
    const box = this.scene.add.graphics();
    box.setDepth(60);
    box.fillStyle(0x000033, 1);
    box.fillRect(nextX - 28, nextY - 32, 56, 50);
    box.lineStyle(2, 0x00D9FF, 1);
    box.strokeRect(nextX - 28, nextY - 32, 56, 50);

    // NEXT label
    this.scene.add.text(nextX, nextY - 22, 'NEXT', {
      fontSize: '7px',
      fontFamily: FONT_FAMILY,
      fill: '#00D9FF'
    }).setOrigin(0.5).setDepth(61);

    // Next bubble preview
    this.nextBubblePreview = this.scene.add.image(nextX, nextY + 5, 'bubble_0');
    this.nextBubblePreview.setScale(0.85);
    this.nextBubblePreview.setDepth(62);
  }

  createPushMeter() {
    // PUSH meter on the right side - shows shots until ceiling drops
    const pushX = PLAYFIELD_RIGHT - 35;
    const pushY = PLAYFIELD_BOTTOM + 30;

    // Box background
    const box = this.scene.add.graphics();
    box.setDepth(60);
    box.fillStyle(0x000033, 1);
    box.fillRect(pushX - 25, pushY - 15, 50, 70);
    box.lineStyle(2, 0x00D9FF, 1);
    box.strokeRect(pushX - 25, pushY - 15, 50, 70);

    // PUSH label
    this.scene.add.text(pushX, pushY - 5, 'PUSH', {
      fontSize: '7px',
      fontFamily: FONT_FAMILY,
      fill: '#ff6600'
    }).setOrigin(0.5).setDepth(61);

    // Push indicator bubbles (small circles showing shots remaining)
    this.pushBubbles = [];
    const bubbleStartY = pushY + 12;

    for (let i = 0; i < SHOTS_BEFORE_DROP; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const bx = pushX - 12 + col * 8;
      const by = bubbleStartY + row * 10;

      const bubble = this.scene.add.circle(bx, by, 3, 0xff6600);
      bubble.setDepth(62);
      this.pushBubbles.push(bubble);
    }
  }

  createRoundDisplay() {
    // ROUND indicator at bottom center
    const roundY = GAME_HEIGHT - 18;

    this.scene.add.text(LAUNCHER_X, roundY, 'ROUND', {
      fontSize: '8px',
      fontFamily: FONT_FAMILY,
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(61);

    this.levelText = this.scene.add.text(LAUNCHER_X + 50, roundY, '01', {
      fontSize: '8px',
      fontFamily: FONT_FAMILY,
      fill: '#FFEB3B',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(61);
  }

  updateScore(score) {
    // Pad to 8 digits like arcade
    this.scoreText.setText(score.toString().padStart(8, '0'));

    // Flash effect
    this.scoreText.setFill('#ffffff');
    this.scene.time.delayedCall(100, () => {
      this.scoreText.setFill('#00ffaa');
    });
  }

  updateLevel(level) {
    this.levelText.setText(level.toString().padStart(2, '0'));
  }

  updateLives(lives) {
    // Lives not shown in original - using push meter instead
  }

  updateNextBubble(colorIndex) {
    this.nextBubblePreview.setTexture(`bubble_${colorIndex}`);

    // Pop-in animation
    this.scene.tweens.add({
      targets: this.nextBubblePreview,
      scale: { from: 0.4, to: 0.85 },
      duration: 150,
      ease: 'Back.easeOut'
    });
  }

  updateShotCounter(shotsRemaining) {
    // Update push meter bubbles
    this.pushBubbles.forEach((bubble, i) => {
      if (i < shotsRemaining) {
        bubble.setFillStyle(0xff6600);
        bubble.setAlpha(1);
      } else {
        bubble.setFillStyle(0x333333);
        bubble.setAlpha(0.5);
      }
    });

    // Warning flash when low
    if (shotsRemaining <= 2) {
      this.pushBubbles.slice(0, shotsRemaining).forEach(bubble => {
        this.scene.tweens.add({
          targets: bubble,
          alpha: 0.3,
          duration: 200,
          yoyo: true
        });
      });
    }
  }

  showCombo(comboCount) {
    if (comboCount < 2) return;

    const text = this.scene.add.text(LAUNCHER_X, 280, `${comboCount}x COMBO!`, {
      fontSize: '18px',
      fontFamily: FONT_FAMILY,
      fill: '#FFEB3B',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: text,
      scale: 1.3,
      y: 250,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          y: 220,
          duration: 400,
          onComplete: () => text.destroy()
        });
      }
    });
  }

  showWarning(message) {
    const warning = this.scene.add.text(LAUNCHER_X, 300, message, {
      fontSize: '14px',
      fontFamily: FONT_FAMILY,
      fill: '#ff3333',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: warning,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => warning.destroy()
    });
  }

  showMessage(message, color = '#ffffff') {
    const text = this.scene.add.text(LAUNCHER_X, 280, message, {
      fontSize: '20px',
      fontFamily: FONT_FAMILY,
      fill: color,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: text,
      scale: { from: 0.5, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          y: 250,
          duration: 600,
          delay: 400,
          ease: 'Power2',
          onComplete: () => text.destroy()
        });
      }
    });
  }
}
