import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, THEME, COLORS, FONT_FAMILY } from '../config/constants.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.level = data.level || 1;
    this.won = data.won || false;
  }

  create() {
    this.cameras.main.fadeIn(400);
    this.sound_mgr = this.game.soundManager;
    this.createBackground();
    this.createResult();
    this.createScore();
    this.createButtons();

    if (this.won) {
      this.createCelebration();
    }
  }

  createBackground() {
    // Purple gradient background
    const bg = this.add.graphics();
    const steps = 20;

    for (let i = 0; i < steps; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(THEME.bgDark),
        Phaser.Display.Color.IntegerToColor(THEME.bgMid),
        steps,
        i
      );
      const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

      bg.fillStyle(hexColor, 1);
      bg.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }

    // Frame
    const frame = this.add.graphics();
    frame.lineStyle(4, THEME.frameCyan, 1);
    frame.strokeRect(30, 30, GAME_WIDTH - 60, GAME_HEIGHT - 60);
  }

  createResult() {
    const resultText = this.won ? 'LEVEL CLEAR!' : 'GAME OVER';
    const resultColor = this.won ? '#00ff88' : '#ff3333';

    const title = this.add.text(GAME_WIDTH / 2, 120, resultText, {
      fontSize: '24px',
      fontFamily: FONT_FAMILY,
      fill: resultColor,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Animate title
    this.tweens.add({
      targets: title,
      scale: { from: 0.3, to: 1 },
      duration: 500,
      ease: 'Back.easeOut'
    });

    if (this.won) {
      // Rainbow color cycle for win
      const colors = ['#ff0000', '#ff9900', '#FFEB3B', '#00ff00', '#00D9FF', '#E91E63'];
      let colorIndex = 0;

      this.time.addEvent({
        delay: 150,
        callback: () => {
          title.setFill(colors[colorIndex % colors.length]);
          colorIndex++;
        },
        loop: true
      });
    }

    // Level info
    this.add.text(GAME_WIDTH / 2, 175, `LEVEL ${this.level}`, {
      fontSize: '12px',
      fontFamily: FONT_FAMILY,
      fill: '#888888'
    }).setOrigin(0.5);
  }

  createScore() {
    // Score label
    this.add.text(GAME_WIDTH / 2, 230, 'SCORE', {
      fontSize: '12px',
      fontFamily: FONT_FAMILY,
      fill: '#00D9FF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Score value
    const scoreText = this.add.text(GAME_WIDTH / 2, 280, '0', {
      fontSize: '32px',
      fontFamily: FONT_FAMILY,
      fill: '#FFEB3B',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    // Animate score counting up
    this.tweens.addCounter({
      from: 0,
      to: this.finalScore,
      duration: 1500,
      ease: 'Power2',
      onUpdate: (tween) => {
        scoreText.setText(Math.round(tween.getValue()).toString());
      }
    });
  }

  createButtons() {
    const buttonY = this.won ? 400 : 380;

    if (this.won) {
      // Next level button
      this.createButton(GAME_WIDTH / 2, buttonY, 'NEXT LEVEL', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { level: this.level + 1 });
        });
      });
    }

    // Retry button
    this.createButton(GAME_WIDTH / 2, this.won ? buttonY + 70 : buttonY, 'RETRY', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: this.level });
      });
    });

    // Menu button
    this.createButton(GAME_WIDTH / 2, this.won ? buttonY + 140 : buttonY + 70, 'MENU', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(THEME.accentPurple, 1);
    bg.fillRoundedRect(-100, -24, 200, 48, 8);
    bg.lineStyle(2, THEME.frameCyan, 1);
    bg.strokeRoundedRect(-100, -24, 200, 48, 8);

    const label = this.add.text(0, 0, text, {
      fontSize: '12px',
      fontFamily: FONT_FAMILY,
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(200, 48);
    button.setInteractive();

    button.on('pointerover', () => {
      if (this.sound_mgr) this.sound_mgr.playSFX('buttonHover');
      bg.clear();
      bg.fillStyle(THEME.framePink, 1);
      bg.fillRoundedRect(-100, -24, 200, 48, 8);
      bg.lineStyle(2, THEME.frameCyan, 1);
      bg.strokeRoundedRect(-100, -24, 200, 48, 8);

      this.tweens.add({
        targets: button,
        scale: 1.05,
        duration: 100
      });
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(THEME.accentPurple, 1);
      bg.fillRoundedRect(-100, -24, 200, 48, 8);
      bg.lineStyle(2, THEME.frameCyan, 1);
      bg.strokeRoundedRect(-100, -24, 200, 48, 8);

      this.tweens.add({
        targets: button,
        scale: 1,
        duration: 100
      });
    });

    button.on('pointerdown', () => {
      if (this.sound_mgr) this.sound_mgr.playSFX('buttonClick');
      this.tweens.add({
        targets: button,
        scale: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => callback()
      });
    });

    return button;
  }

  createCelebration() {
    // Firework particles
    for (let burst = 0; burst < 8; burst++) {
      this.time.delayedCall(burst * 400, () => {
        const bx = Phaser.Math.Between(80, GAME_WIDTH - 80);
        const by = Phaser.Math.Between(100, 300);
        const burstColor = COLORS[burst % COLORS.length];

        // Flash
        const flash = this.add.circle(bx, by, 5, 0xffffff, 1);
        this.tweens.add({
          targets: flash,
          radius: 40,
          alpha: 0,
          duration: 200,
          onComplete: () => flash.destroy()
        });

        // Particles
        for (let i = 0; i < 12; i++) {
          const particle = this.add.image(bx, by, 'star');
          particle.setTint(burstColor);
          particle.setScale(0.8);

          const angle = (i / 12) * Math.PI * 2;
          const distance = Phaser.Math.Between(50, 100);

          this.tweens.add({
            targets: particle,
            x: bx + Math.cos(angle) * distance,
            y: by + Math.sin(angle) * distance + 40,
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 800,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      });
    }

    // Falling confetti
    for (let i = 0; i < 30; i++) {
      this.time.delayedCall(i * 100, () => {
        const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
        const color = COLORS[Phaser.Math.Between(0, COLORS.length - 1)];

        const confetti = this.add.rectangle(x, -20, 8, 12, color);

        this.tweens.add({
          targets: confetti,
          y: GAME_HEIGHT + 50,
          x: x + Phaser.Math.Between(-50, 50),
          rotation: Phaser.Math.FloatBetween(0, Math.PI * 4),
          duration: Phaser.Math.Between(2000, 3500),
          ease: 'Sine.easeIn',
          onComplete: () => confetti.destroy()
        });
      });
    }
  }
}
