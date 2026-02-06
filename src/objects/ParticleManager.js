import Phaser from 'phaser';
import { COLORS, THEME, FONT_FAMILY } from '../config/constants.js';

export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
  }

  createPopEffect(x, y, colorIndex) {
    const color = COLORS[colorIndex];

    // Main burst particles
    for (let i = 0; i < 10; i++) {
      const particle = this.scene.add.image(x, y, 'particle');
      particle.setTint(color);
      particle.setScale(Phaser.Math.FloatBetween(0.5, 1));
      particle.setDepth(100);

      const angle = (i / 10) * Math.PI * 2;
      const speed = Phaser.Math.Between(100, 180);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }

    // Star sparkles
    for (let i = 0; i < 5; i++) {
      const star = this.scene.add.image(x, y, 'star');
      star.setTint(0xffffff);
      star.setScale(0.5);
      star.setDepth(101);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(40, 80);

      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0.2,
        rotation: Math.PI * 2,
        duration: 500,
        ease: 'Power2',
        onComplete: () => star.destroy()
      });
    }

    // Flash circle
    const flash = this.scene.add.circle(x, y, 5, 0xffffff, 0.8);
    flash.setDepth(99);

    this.scene.tweens.add({
      targets: flash,
      radius: 30,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    });
  }

  createDropEffect(x, y, colorIndex) {
    const color = COLORS[colorIndex];

    // Trail particles
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 30, () => {
        const trail = this.scene.add.image(
          x + Phaser.Math.Between(-8, 8),
          y,
          'particle'
        );
        trail.setTint(color);
        trail.setScale(0.8);
        trail.setAlpha(0.7);
        trail.setDepth(90);

        this.scene.tweens.add({
          targets: trail,
          y: y + 80,
          alpha: 0,
          scale: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => trail.destroy()
        });
      });
    }

    // Sparkle
    const sparkle = this.scene.add.image(x, y, 'sparkle');
    sparkle.setTint(color);
    sparkle.setScale(0.8);
    sparkle.setDepth(91);

    this.scene.tweens.add({
      targets: sparkle,
      rotation: Math.PI,
      alpha: 0,
      scale: 0.3,
      duration: 300,
      onComplete: () => sparkle.destroy()
    });
  }

  createScorePopup(x, y, score) {
    const text = this.scene.add.text(x, y, `+${score}`, {
      fontSize: '16px',
      fontFamily: FONT_FAMILY,
      fill: '#FFEB3B',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    text.setDepth(150);

    this.scene.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  createComboEffect(x, y, comboCount) {
    // Rainbow ring expansion
    const ringColors = [0xff0000, 0xff9900, 0xffff00, 0x00ff00, 0x00ffff, 0xff00ff];

    ringColors.forEach((color, i) => {
      this.scene.time.delayedCall(i * 50, () => {
        const ring = this.scene.add.circle(x, y, 20, color, 0);
        ring.setStrokeStyle(4, color, 0.8);
        ring.setDepth(120);

        this.scene.tweens.add({
          targets: ring,
          radius: 100 + i * 15,
          alpha: 0,
          duration: 600,
          ease: 'Power2',
          onComplete: () => ring.destroy()
        });
      });
    });

    // Sparkle burst
    for (let i = 0; i < 12; i++) {
      const sparkle = this.scene.add.image(x, y, 'star');
      sparkle.setTint(ringColors[i % ringColors.length]);
      sparkle.setScale(0.8);
      sparkle.setDepth(121);

      const angle = (i / 12) * Math.PI * 2;
      const distance = 120;

      this.scene.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        rotation: Math.PI * 2,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }

    // Screen shake for big combos
    if (comboCount >= 3) {
      this.scene.cameras.main.shake(200, 0.01 * comboCount);
    }
  }

  createBigPopEffect(x, y) {
    // Used for clearing large groups
    const colors = [0xff0000, 0xff9900, 0xffff00, 0x00ff00, 0x00ffff, 0xff00ff];

    // Central flash
    const flash = this.scene.add.circle(x, y, 10, 0xffffff, 1);
    flash.setDepth(200);

    this.scene.tweens.add({
      targets: flash,
      radius: 80,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });

    // Multi-colored particle burst
    for (let i = 0; i < 20; i++) {
      const color = colors[i % colors.length];
      const particle = this.scene.add.image(x, y, 'star');
      particle.setTint(color);
      particle.setScale(Phaser.Math.FloatBetween(0.5, 1));
      particle.setDepth(199);

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.Between(80, 150);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        rotation: Math.PI * 3,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  createLaunchTrail(x, y, color) {
    const trail = this.scene.add.circle(x, y, 6, color, 0.5);
    trail.setDepth(5);

    this.scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => trail.destroy()
    });
  }

  createWinEffect() {
    const colors = COLORS;
    const centerX = 240;
    const centerY = 300;

    // Firework bursts
    for (let burst = 0; burst < 5; burst++) {
      this.scene.time.delayedCall(burst * 300, () => {
        const bx = Phaser.Math.Between(80, 400);
        const by = Phaser.Math.Between(100, 400);
        const burstColor = colors[burst % colors.length];

        for (let i = 0; i < 15; i++) {
          const particle = this.scene.add.image(bx, by, 'star');
          particle.setTint(burstColor);
          particle.setScale(0.8);
          particle.setDepth(250);

          const angle = (i / 15) * Math.PI * 2;
          const distance = Phaser.Math.Between(60, 120);

          this.scene.tweens.add({
            targets: particle,
            x: bx + Math.cos(angle) * distance,
            y: by + Math.sin(angle) * distance + 50, // gravity
            alpha: 0,
            rotation: Math.PI * 2,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      });
    }
  }
}
