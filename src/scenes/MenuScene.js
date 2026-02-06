import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, THEME, FONT_FAMILY, LAUNCHER_X } from '../config/constants.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.cameras.main.fadeIn(400);
    this.sound_mgr = this.game.soundManager;
    this.createBackground();
    this.createTitle();
    this.createBubCharacter();
    this.createButtons();
    this.createFloatingBubbles();
    this.createInstructions();
    this.createMuteButton();

    if (this.sound_mgr) {
      this.sound_mgr.startMusic('menu');
    }
  }

  createBackground() {
    // Purple gradient background using new palette
    const bg = this.add.graphics();
    const steps = 30;

    for (let i = 0; i < steps; i++) {
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(THEME.bgDark),
        Phaser.Display.Color.IntegerToColor(THEME.bgLight),
        steps,
        i
      );
      const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

      bg.fillStyle(hexColor, 1);
      bg.fillRect(0, (GAME_HEIGHT / steps) * i, GAME_WIDTH, GAME_HEIGHT / steps + 1);
    }

    // Decorative frame
    const frame = this.add.graphics();
    frame.lineStyle(4, THEME.frameCyan, 1);
    frame.strokeRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40);

    // Corner accents
    frame.lineStyle(3, THEME.frameGreen, 0.8);
    const cornerSize = 30;
    // Top-left
    frame.lineBetween(20, 20, 20 + cornerSize, 20);
    frame.lineBetween(20, 20, 20, 20 + cornerSize);
    // Top-right
    frame.lineBetween(GAME_WIDTH - 20, 20, GAME_WIDTH - 20 - cornerSize, 20);
    frame.lineBetween(GAME_WIDTH - 20, 20, GAME_WIDTH - 20, 20 + cornerSize);
    // Bottom-left
    frame.lineBetween(20, GAME_HEIGHT - 20, 20 + cornerSize, GAME_HEIGHT - 20);
    frame.lineBetween(20, GAME_HEIGHT - 20, 20, GAME_HEIGHT - 20 - cornerSize);
    // Bottom-right
    frame.lineBetween(GAME_WIDTH - 20, GAME_HEIGHT - 20, GAME_WIDTH - 20 - cornerSize, GAME_HEIGHT - 20);
    frame.lineBetween(GAME_WIDTH - 20, GAME_HEIGHT - 20, GAME_WIDTH - 20, GAME_HEIGHT - 20 - cornerSize);
  }

  createTitle() {
    // Main title with pixel font
    const title = this.add.text(GAME_WIDTH / 2, 100, 'POODLE', {
      fontSize: '36px',
      fontFamily: FONT_FAMILY,
      fill: '#00D9FF',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const title2 = this.add.text(GAME_WIDTH / 2, 155, 'BOBBLE', {
      fontSize: '36px',
      fontFamily: FONT_FAMILY,
      fill: '#E91E63',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Rainbow color animation for title
    const colors = ['#ff0000', '#ff9900', '#FFEB3B', '#00ff00', '#00D9FF', '#E91E63'];
    let colorIndex = 0;

    this.time.addEvent({
      delay: 200,
      callback: () => {
        title.setFill(colors[colorIndex % colors.length]);
        title2.setFill(colors[(colorIndex + 3) % colors.length]);
        colorIndex++;
      },
      loop: true
    });

    // Floating animation
    this.tweens.add({
      targets: [title, title2],
      y: '+=8',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createBubCharacter() {
    // Container for the character
    const container = this.add.container(GAME_WIDTH / 2, 265);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillEllipse(0, 30, 50, 14);
    container.add(shadow);

    // Add the sprite
    const sprite = this.add.sprite(0, 0, 'bub');
    sprite.setOrigin(0.5, 0.5);
    sprite.setScale(0.3);
    container.add(sprite);

    // Bounce animation
    this.tweens.add({
      targets: container,
      y: 260,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Squash and stretch on sprite
    this.tweens.add({
      targets: sprite,
      scaleY: 0.29,
      scaleX: 0.31,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createButtons() {
    // Play button
    this.createButton(GAME_WIDTH / 2, 380, 'PLAY', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: 1 });
      });
    });

    // Level select button
    this.createButton(GAME_WIDTH / 2, 450, 'LEVELS', () => {
      this.showLevelSelect();
    });
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(THEME.accentPurple, 1);
    bg.fillRoundedRect(-110, -28, 220, 56, 10);
    bg.lineStyle(3, THEME.frameCyan, 1);
    bg.strokeRoundedRect(-110, -28, 220, 56, 10);

    // Button text with pixel font
    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      fontFamily: FONT_FAMILY,
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    button.add([bg, label]);
    button.setSize(220, 56);
    button.setInteractive();

    button.on('pointerover', () => {
      if (this.sound_mgr) this.sound_mgr.playSFX('buttonHover');
      bg.clear();
      bg.fillStyle(THEME.framePink, 1);
      bg.fillRoundedRect(-110, -28, 220, 56, 10);
      bg.lineStyle(3, THEME.frameCyan, 1);
      bg.strokeRoundedRect(-110, -28, 220, 56, 10);

      this.tweens.add({
        targets: button,
        scale: 1.05,
        duration: 100
      });
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(THEME.accentPurple, 1);
      bg.fillRoundedRect(-110, -28, 220, 56, 10);
      bg.lineStyle(3, THEME.frameCyan, 1);
      bg.strokeRoundedRect(-110, -28, 220, 56, 10);

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

  createFloatingBubbles() {
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      const y = Phaser.Math.Between(350, GAME_HEIGHT - 80);
      const colorIndex = Phaser.Math.Between(0, 5);

      const bubble = this.add.image(x, y, `bubble_${colorIndex}`);
      bubble.setAlpha(0.25);
      bubble.setScale(Phaser.Math.FloatBetween(0.6, 1.1));
      bubble.setDepth(-1);

      this.tweens.add({
        targets: bubble,
        y: y - Phaser.Math.Between(30, 60),
        x: x + Phaser.Math.Between(-20, 20),
        alpha: 0.1,
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  createInstructions() {
    this.add.text(GAME_WIDTH / 2, 550,
      'AIM   CLICK   MATCH 3+', {
      fontSize: '8px',
      fontFamily: FONT_FAMILY,
      fill: '#888888'
    }).setOrigin(0.5);

    // Copyright/credit
    this.add.text(GAME_WIDTH / 2, 610, 'TAITO CORP.', {
      fontSize: '8px',
      fontFamily: FONT_FAMILY,
      fill: '#444444'
    }).setOrigin(0.5);
  }

  createMuteButton() {
    const isMuted = this.sound_mgr ? this.sound_mgr.isMuted() : false;
    const muteBtn = this.add.text(GAME_WIDTH - 40, 35, isMuted ? '🔇' : '🔊', {
      fontSize: '20px',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive().setDepth(50);

    muteBtn.on('pointerdown', () => {
      if (this.sound_mgr) {
        const muted = this.sound_mgr.toggleMute();
        muteBtn.setText(muted ? '🔇' : '🔊');
      }
    });
  }

  showLevelSelect() {
    const overlay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    overlay.setDepth(100);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.95);
    bg.fillRoundedRect(-210, -280, 420, 560, 20);
    bg.lineStyle(3, THEME.frameCyan, 1);
    bg.strokeRoundedRect(-210, -280, 420, 560, 20);
    overlay.add(bg);

    // Title
    const title = this.add.text(0, -250, 'SELECT LEVEL', {
      fontSize: '14px',
      fontFamily: FONT_FAMILY,
      fill: '#00D9FF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    overlay.add(title);

    // Level buttons grid
    const cols = 5;
    const startX = -160;
    const startY = -180;
    const spacingX = 75;
    const spacingY = 70;

    for (let i = 0; i < 30; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      const levelBtn = this.add.container(x, y);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(THEME.accentPurple, 1);
      btnBg.fillRoundedRect(-28, -28, 56, 56, 8);
      btnBg.lineStyle(2, THEME.frameCyan, 0.8);
      btnBg.strokeRoundedRect(-28, -28, 56, 56, 8);

      const btnText = this.add.text(0, 0, `${i + 1}`, {
        fontSize: '14px',
        fontFamily: FONT_FAMILY,
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      levelBtn.add([btnBg, btnText]);
      levelBtn.setSize(56, 56);
      levelBtn.setInteractive();

      levelBtn.on('pointerover', () => {
        if (this.sound_mgr) this.sound_mgr.playSFX('buttonHover');
        btnBg.clear();
        btnBg.fillStyle(THEME.framePink, 1);
        btnBg.fillRoundedRect(-28, -28, 56, 56, 8);
        btnBg.lineStyle(2, THEME.frameCyan, 1);
        btnBg.strokeRoundedRect(-28, -28, 56, 56, 8);
      });

      levelBtn.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(THEME.accentPurple, 1);
        btnBg.fillRoundedRect(-28, -28, 56, 56, 8);
        btnBg.lineStyle(2, THEME.frameCyan, 0.8);
        btnBg.strokeRoundedRect(-28, -28, 56, 56, 8);
      });

      levelBtn.on('pointerdown', () => {
        if (this.sound_mgr) this.sound_mgr.playSFX('buttonClick');
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { level: i + 1 });
        });
      });

      overlay.add(levelBtn);
    }

    // Close button
    const closeBtn = this.add.text(185, -260, 'X', {
      fontSize: '16px',
      fontFamily: FONT_FAMILY,
      fill: '#ff3333',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerover', () => closeBtn.setFill('#ff6666'));
    closeBtn.on('pointerout', () => closeBtn.setFill('#ff3333'));
    closeBtn.on('pointerdown', () => overlay.destroy());

    overlay.add(closeBtn);
  }
}
