import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, THEME, FONT_FAMILY } from '../config/constants.js';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super('SplashScene');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.cameras.main.setBackgroundColor(THEME.bgDark);

    // Title
    this.add.text(cx, cy - 80, 'POODLE\nBOBBLE', {
      fontSize: '36px',
      fontFamily: FONT_FAMILY,
      fill: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
      lineSpacing: 12
    }).setOrigin(0.5);

    // Pulsing "Tap to Start" prompt
    const prompt = this.add.text(cx, cy + 60, 'TAP TO START', {
      fontSize: '16px',
      fontFamily: FONT_FAMILY,
      fill: '#00D9FF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Any click/tap/key advances to BootScene
    this.input.once('pointerdown', () => this.proceed());
    this.input.keyboard.once('keydown', () => this.proceed());
  }

  proceed() {
    // Create AudioContext NOW during the user gesture so it starts 'running'.
    // If we wait until after the fade animation, the gesture context expires
    // and the AudioContext will be created as 'suspended'.
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.game._audioCtx = ctx;
    } catch (e) {
      // Web Audio not available — SoundManager will handle gracefully
    }

    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('BootScene');
    });
  }
}
