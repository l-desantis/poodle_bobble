import Phaser from 'phaser';
import { LAUNCHER_X, LAUNCHER_Y, THEME } from '../config/constants.js';

export class BubAndBob {
  constructor(scene) {
    this.scene = scene;

    // Position for the character
    this.baseX = LAUNCHER_X;
    this.baseY = LAUNCHER_Y + 10;

    // Create glowing platform beneath character
    this.createPlatform();

    // Create container to hold sprite and eyes together
    this.container = this.scene.add.container(this.baseX, this.baseY);
    this.container.setDepth(25);

    // Create the sprite from the loaded image
    this.sprite = this.scene.add.sprite(0, 0, 'bub');
    this.sprite.setOrigin(0.5, 0.5);
    this.sprite.setScale(0.15);
    this.container.add(this.sprite);

    // Create eyes on top of the sprite — scaled proportionally (0.15/0.8 ≈ 0.1875)
    const eyeOffsetY = -2;
    this.leftEye = this.createEye(-2.5, eyeOffsetY);
    this.rightEye = this.createEye(2.5, eyeOffsetY);
    this.container.add(this.leftEye.container);
    this.container.add(this.rightEye.container);

    // Store reference for compatibility with existing code
    this.bub = {
      container: this.container,
      leftEye: this.leftEye,
      rightEye: this.rightEye,
      baseY: this.baseY
    };

    this.createLauncher();
    this.setupAnimations();
  }

  createPlatform() {
    this.platform = this.scene.add.graphics();
    this.platform.setDepth(19);

    // Circular glow
    this.platform.fillStyle(THEME.frameCyan, 0.12);
    this.platform.fillCircle(this.baseX, this.baseY + 18, 38);
    this.platform.fillStyle(THEME.frameCyan, 0.08);
    this.platform.fillCircle(this.baseX, this.baseY + 18, 50);

    // Subtle pulsing tween
    this.scene.tweens.add({
      targets: this.platform,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createEye(x, y) {
    const container = this.scene.add.container(x, y);
    const g = this.scene.add.graphics();
    container.add(g);

    // Sclera (White part) — scaled down proportionally
    g.fillStyle(0x000000, 1);
    g.fillEllipse(0, 0, 5, 7);
    g.fillStyle(0xffffff, 1);
    g.fillEllipse(0, 0, 4, 6);

    // Pupil
    const pupil = this.scene.add.graphics();
    pupil.fillStyle(0x000000, 1);
    pupil.fillEllipse(0, 0, 2.5, 3.5);
    pupil.y = 0.4;
    container.add(pupil);

    // Highlight
    const highlight = this.scene.add.graphics();
    highlight.fillStyle(0xffffff, 1);
    highlight.fillCircle(-0.8, -1.5, 1);
    container.add(highlight);

    return { container, pupil };
  }

  createLauncher() {
    const launcherBase = this.scene.add.graphics();
    launcherBase.setDepth(20);
    launcherBase.fillStyle(0x3a2063, 1);
    launcherBase.fillCircle(LAUNCHER_X, LAUNCHER_Y, 28);

    // Arrow
    this.arrow = this.scene.add.graphics();
    this.arrow.x = LAUNCHER_X;
    this.arrow.y = LAUNCHER_Y;
    this.arrow.setDepth(22);
    this.arrow.fillStyle(0xFFEB3B, 1);
    this.arrow.beginPath();
    this.arrow.moveTo(0, -50);
    this.arrow.lineTo(-10, 0);
    this.arrow.lineTo(10, 0);
    this.arrow.closePath();
    this.arrow.fill();
  }

  setupAnimations() {
    // Squash-and-stretch — scaled for 0.15 base
    this.idleTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.145,
      scaleX: 0.155,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtle bounce on the container — smaller magnitude
    this.bounceTween = this.scene.tweens.add({
      targets: this.container,
      y: this.baseY + 1,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  lookAt(angle) {
    this.arrow.setAngle(angle + 90);
    const rad = (angle) * (Math.PI / 180);
    // Scaled pupil movement (was 4, now ~0.8)
    this.leftEye.pupil.x = Math.cos(rad) * 0.8;
    this.leftEye.pupil.y = Math.sin(rad) * 0.8 + 0.4;
    this.rightEye.pupil.x = Math.cos(rad) * 0.8;
    this.rightEye.pupil.y = Math.sin(rad) * 0.8 + 0.4;
  }

  celebrate() {
    // Happy jump — scaled down (was -20, now -8)
    this.scene.tweens.add({
      targets: this.container,
      y: this.baseY - 8,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 150,
      yoyo: true,
      ease: 'Power2'
    });
  }

  showPayonpah() {
    // Big celebration for combo — scaled down
    this.scene.tweens.add({
      targets: this.container,
      y: this.baseY - 12,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 200,
      yoyo: true,
      repeat: 1,
      ease: 'Bounce.out'
    });
  }

  panic() {
    // Shake animation — scaled down (was 5, now 2)
    this.scene.tweens.add({
      targets: this.container,
      x: this.baseX - 2,
      duration: 50,
      yoyo: true,
      repeat: 5,
      ease: 'Linear'
    });
  }

  defeat() {
    // Sad slouch — adjusted for 0.15 scale
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.11,
      scaleX: 0.14,
      duration: 300,
      ease: 'Power2'
    });
    this.scene.tweens.add({
      targets: this.container,
      y: this.baseY + 4,
      duration: 300,
      ease: 'Power2'
    });
  }

  setMood(mood) {
    if (mood === 'worried') {
      this.leftEye.pupil.y = 1.2;
      this.rightEye.pupil.y = 1.2;
    } else {
      this.leftEye.pupil.y = 0.4;
      this.rightEye.pupil.y = 0.4;
    }
  }
}
