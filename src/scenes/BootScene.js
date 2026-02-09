import Phaser from 'phaser';
import { COLORS, THEME, BUBBLE_RADIUS, FONT_FAMILY } from '../config/constants.js';
import { SoundManager } from '../objects/SoundManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create loading bar with arcade style
    const progressBox = this.add.graphics();
    progressBox.fillStyle(THEME.bgMid, 1);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);
    progressBox.lineStyle(3, THEME.frameCyan, 1);
    progressBox.strokeRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(width / 2, height / 2 - 60, 'LOADING', {
      fontSize: '18px',
      fontFamily: FONT_FAMILY,
      fill: '#00D9FF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Pulsing animation on loading text
    this.tweens.add({
      targets: loadingText,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '14px',
      fontFamily: FONT_FAMILY,
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(THEME.frameCyan, 1);
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 8);
      percentText.setText(Math.round(value * 100) + '%');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load sprite images
    this.load.image('bub', `${import.meta.env.BASE_URL}assets/images/poodle_bub.png`);

    // Generate all textures
    this.createBubbleTextures();
    this.createParticleTextures();
    this.createUITextures();
  }

  createBubbleTextures() {
    const radius = BUBBLE_RADIUS;

    COLORS.forEach((color, index) => {
      const size = (radius + 4) * 2;
      const cx = radius + 4;
      const cy = radius + 4;
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      // Get color components for shading
      const baseColor = Phaser.Display.Color.IntegerToColor(color);
      const darkColor = baseColor.clone().darken(40);
      const lightColor = baseColor.clone().lighten(20);

      // Outer shadow/glow
      graphics.fillStyle(0x000000, 0.3);
      graphics.fillCircle(cx + 2, cy + 2, radius);

      // Main bubble body - darker base
      graphics.fillStyle(darkColor.color, 1);
      graphics.fillCircle(cx, cy, radius);

      // Mid gradient layer
      graphics.fillStyle(color, 1);
      graphics.fillCircle(cx - 1, cy - 1, radius - 2);

      // Inner lighter area
      graphics.fillStyle(lightColor.color, 1);
      graphics.fillCircle(cx - 2, cy - 2, radius - 5);

      // Main glossy highlight (large, top-left)
      graphics.fillStyle(0xffffff, 0.85);
      graphics.fillEllipse(cx - 5, cy - 5, radius * 0.6, radius * 0.5);

      // Secondary smaller highlight
      graphics.fillStyle(0xffffff, 0.95);
      graphics.fillCircle(cx - 6, cy - 7, 4);

      // Tiny specular dot
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(cx - 7, cy - 8, 2);

      // Bottom reflection hint
      graphics.fillStyle(0xffffff, 0.15);
      graphics.fillEllipse(cx + 2, cy + 6, radius * 0.4, radius * 0.2);

      graphics.generateTexture(`bubble_${index}`, size, size);
      graphics.destroy();
    });
  }

  createParticleTextures() {
    // Star particle
    const starGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    starGraphics.fillStyle(0xffffff, 1);
    this.drawStar(starGraphics, 8, 8, 5, 8, 4);
    starGraphics.generateTexture('star', 16, 16);
    starGraphics.destroy();

    // Circle particle
    const circleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    circleGraphics.fillStyle(0xffffff, 1);
    circleGraphics.fillCircle(6, 6, 6);
    circleGraphics.generateTexture('particle', 12, 12);
    circleGraphics.destroy();

    // Sparkle particle
    const sparkleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    sparkleGraphics.fillStyle(0xffffff, 1);
    sparkleGraphics.fillRect(6, 0, 4, 16);
    sparkleGraphics.fillRect(0, 6, 16, 4);
    sparkleGraphics.generateTexture('sparkle', 16, 16);
    sparkleGraphics.destroy();
  }

  drawStar(graphics, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;

    graphics.beginPath();
    graphics.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      graphics.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      graphics.lineTo(x, y);
      rot += step;
    }

    graphics.lineTo(cx, cy - outerRadius);
    graphics.closePath();
    graphics.fillPath();
  }

  createUITextures() {
    // Arrow pointer for launcher
    const arrowGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    arrowGraphics.fillStyle(0xffaa00, 1);
    arrowGraphics.fillTriangle(15, 0, 0, 30, 30, 30);
    arrowGraphics.lineStyle(2, 0xffdd00, 1);
    arrowGraphics.strokeTriangle(15, 0, 0, 30, 30, 30);
    arrowGraphics.generateTexture('arrow', 30, 30);
    arrowGraphics.destroy();
  }

  create() {
    // Initialize sound manager and store on game for cross-scene access.
    // Pass pre-created AudioContext from SplashScene (created during user gesture
    // so it's already 'running', not 'suspended').
    const soundManager = new SoundManager();
    soundManager.init(this.game._audioCtx);
    this.game.soundManager = soundManager;

    this.scene.start('MenuScene');
  }
}
