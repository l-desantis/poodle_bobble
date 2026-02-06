import Phaser from 'phaser';
import { Grid } from '../objects/Grid.js';
import { Launcher } from '../objects/Launcher.js';
import { BubblePool } from '../objects/BubblePool.js';
import { ParticleManager } from '../objects/ParticleManager.js';
import { UI } from '../objects/UI.js';
import { ArcadeFrame } from '../objects/ArcadeFrame.js';
import { BubAndBob } from '../objects/BubAndBob.js';
import { getLevel } from '../config/levels.js';
import {
  COLORS, BUBBLE_RADIUS, GAME_WIDTH, GAME_HEIGHT,
  IDLE_SHOOT_TIME, SHOTS_BEFORE_DROP, MAX_LIVES,
  SCORE_BASE_MATCH, SCORE_EXTRA_BUBBLE, SCORE_FLOATING,
  PLAYFIELD_LEFT, PLAYFIELD_RIGHT, PLAYFIELD_TOP, PLAYFIELD_BOTTOM,
  GRID_OFFSET_X, GRID_OFFSET_Y, ROW_HEIGHT
} from '../config/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.currentLevel = data.level || 1;
    this.score = 0;
    this.lives = MAX_LIVES;
    this.shotsSinceDrop = 0;
    this.currentBubbleColor = 0;
    this.nextBubbleColor = 0;
    this.isProcessing = false;
    this.flyingBubble = null;
    this.comboCount = 0;
  }

  create() {
    this.cameras.main.fadeIn(400);

    // Set up physics world bounds - extend to full height for launcher area
    this.physics.world.setBounds(
      PLAYFIELD_LEFT,
      PLAYFIELD_TOP,
      PLAYFIELD_RIGHT - PLAYFIELD_LEFT,
      GAME_HEIGHT - PLAYFIELD_TOP
    );

    // Create arcade-style frame and background
    this.arcadeFrame = new ArcadeFrame(this);

    // Create bubble pool for object reuse
    this.bubblePool = new BubblePool(this, 150);

    // Create game objects
    this.grid = new Grid(this, this.bubblePool);
    this.launcher = new Launcher(this, this.bubblePool);
    this.particles = new ParticleManager(this);
    this.ui = new UI(this);

    // Create Bub and Bob characters
    this.characters = new BubAndBob(this);

    // Initialize level
    const levelData = getLevel(this.currentLevel);
    this.grid.initializeFromLevel(levelData);

    // Set up initial bubbles
    this.nextBubbleColor = this.grid.getRandomActiveColor();
    this.loadNextBubble();

    // Update UI
    this.ui.updateLevel(this.currentLevel);
    this.ui.updateShotCounter(SHOTS_BEFORE_DROP - this.shotsSinceDrop);

    // Input handling
    this.input.on('pointermove', (pointer) => {
      if (!this.isProcessing) {
        this.launcher.aimAt(pointer.x, pointer.y);
        this.characters.lookAt(this.launcher.angle);
      }
    });

    this.input.on('pointerdown', () => {
      if (!this.isProcessing) {
        this.shoot();
      }
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.isProcessing) {
        this.shoot();
      }
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    // Idle timer for auto-shoot
    this.resetIdleTimer();

    // Wall bounce handling
    this.physics.world.on('worldbounds', (body, up, down, left, right) => {
      if (body.gameObject === this.flyingBubble) {
        if (up) {
          this.handleCeilingHit();
        }
      }
    });

    // Sound manager
    this.sound_mgr = this.game.soundManager;
    if (this.sound_mgr) {
      this.sound_mgr.startMusic('game');
    }

    // Mute button
    this.createMuteButton();

    // Show level start message
    this.ui.showMessage(`ROUND ${this.currentLevel}`, '#00ffff');
  }

  createMuteButton() {
    const isMuted = this.sound_mgr ? this.sound_mgr.isMuted() : false;
    const muteBtn = this.add.text(GAME_WIDTH - 25, 35, isMuted ? '🔇' : '🔊', {
      fontSize: '16px',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive().setDepth(50);

    muteBtn.on('pointerdown', (pointer) => {
      pointer.event.stopPropagation();
      if (this.sound_mgr) {
        const muted = this.sound_mgr.toggleMute();
        muteBtn.setText(muted ? '🔇' : '🔊');
      }
    });
  }

  resetIdleTimer() {
    if (this.idleTimer) {
      this.idleTimer.remove();
    }
    this.idleTimer = this.time.delayedCall(IDLE_SHOOT_TIME, () => {
      if (!this.isProcessing && this.launcher.canShoot) {
        this.ui.showWarning('AUTO FIRE!');
        this.shoot();
      }
    });
  }

  loadNextBubble() {
    this.currentBubbleColor = this.nextBubbleColor;
    this.grid.updateActiveColors();
    this.nextBubbleColor = this.grid.getRandomActiveColor();

    this.launcher.loadBubble(this.currentBubbleColor);
    this.ui.updateNextBubble(this.nextBubbleColor);
  }

  shoot() {
    if (!this.launcher.canShoot || this.isProcessing) return;

    this.resetIdleTimer();
    this.flyingBubble = this.launcher.shoot();

    if (!this.flyingBubble) return;

    if (this.sound_mgr) this.sound_mgr.playSFX('shoot');
    this.isProcessing = true;
    this.comboCount = 0;

    // Set up collision with grid bubbles
    this.physics.add.overlap(
      this.flyingBubble,
      this.grid.bubbles,
      this.handleBubbleCollision,
      null,
      this
    );

    // Create launch trail effect
    this.createTrailEffect();
  }

  createTrailEffect() {
    if (!this.flyingBubble) return;

    const color = COLORS[this.flyingBubble.colorIndex];
    const trailInterval = this.time.addEvent({
      delay: 25,
      callback: () => {
        if (this.flyingBubble && this.flyingBubble.active) {
          this.particles.createLaunchTrail(
            this.flyingBubble.x,
            this.flyingBubble.y,
            color
          );
        } else {
          trailInterval.remove();
        }
      },
      loop: true
    });
  }

  handleBubbleCollision(shotBubble, targetBubble) {
    if (shotBubble !== this.flyingBubble) return;
    this.snapAndProcess(shotBubble);
  }

  handleCeilingHit() {
    if (this.flyingBubble) {
      this.snapAndProcess(this.flyingBubble);
    }
  }

  snapAndProcess(bubble) {
    bubble.body.setVelocity(0, 0);

    const gridPos = this.grid.snapToGrid(bubble.x, bubble.y);
    bubble.setPosition(gridPos.x, gridPos.y);

    // Check if position is already occupied
    if (this.grid.grid[gridPos.row]?.[gridPos.col]) {
      const emptyPos = this.findNearestEmpty(gridPos.row, gridPos.col);
      if (emptyPos) {
        bubble.setPosition(emptyPos.x, emptyPos.y);
        gridPos.row = emptyPos.row;
        gridPos.col = emptyPos.col;
      }
    }

    this.grid.addBubble(bubble, gridPos.row, gridPos.col);

    const matches = this.grid.findMatches(gridPos.row, gridPos.col, bubble.colorIndex);

    if (matches.length >= 3) {
      this.comboCount++;
      this.processMatches(matches, gridPos);
    } else {
      this.shotsSinceDrop++;
      this.checkShotCounter();
      this.finishTurn();
    }

    this.flyingBubble = null;
  }

  findNearestEmpty(row, col) {
    const isOddRow = row % 2 === 1;
    const offsets = isOddRow
      ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
      : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

    for (const [dr, dc] of offsets) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && c >= 0 && !this.grid.grid[r]?.[c]) {
        const isOdd = r % 2 === 1;
        const offset = isOdd ? BUBBLE_RADIUS : 0;
        const maxCol = isOdd ? this.grid.cols - 2 : this.grid.cols - 1;
        if (c <= maxCol) {
          return {
            row: r,
            col: c,
            x: GRID_OFFSET_X + c * BUBBLE_RADIUS * 2 + offset,
            y: GRID_OFFSET_Y + r * ROW_HEIGHT + this.grid.ceilingOffset
          };
        }
      }
    }
    return null;
  }

  processMatches(matches, gridPos) {
    const baseScore = SCORE_BASE_MATCH;
    const extraScore = Math.max(0, matches.length - 3) * SCORE_EXTRA_BUBBLE;
    let matchScore = baseScore + extraScore;

    // Sound for match
    if (this.sound_mgr) {
      this.sound_mgr.playSFX(matches.length >= 4 ? 'match4plus' : 'match3');
    }

    // Characters celebrate
    this.characters.celebrate();

    // Big combo effects
    if (matches.length >= 5) {
      this.particles.createBigPopEffect(gridPos.x, gridPos.y);
      this.characters.showPayonpah();
    }

    // Pop matched bubbles
    matches.forEach((bubble, index) => {
      this.time.delayedCall(index * 35, () => {
        this.particles.createPopEffect(bubble.x, bubble.y, bubble.colorIndex);

        this.tweens.add({
          targets: bubble,
          scale: 0,
          alpha: 0,
          duration: 100,
          onComplete: () => {
            this.grid.removeBubble(bubble);
            this.bubblePool.release(bubble);
          }
        });
      });
    });

    this.particles.createScorePopup(gridPos.x, gridPos.y, matchScore);
    this.score += matchScore;
    this.ui.updateScore(this.score);

    // Check for floating bubbles
    this.time.delayedCall(matches.length * 35 + 120, () => {
      const floating = this.grid.findFloatingBubbles();

      if (floating.length > 0) {
        const floatingScore = floating.length * SCORE_FLOATING;
        this.score += floatingScore;
        this.ui.updateScore(this.score);

        this.comboCount++;
        this.ui.showCombo(this.comboCount);
        this.particles.createComboEffect(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, this.comboCount);

        if (this.sound_mgr) {
          this.sound_mgr.playSFX('floatingBonus');
          this.sound_mgr.playCombo(this.comboCount);
        }

        // Drop floating bubbles
        floating.forEach((bubble, index) => {
          this.time.delayedCall(index * 20, () => {
            this.particles.createDropEffect(bubble.x, bubble.y, bubble.colorIndex);
            this.grid.removeBubble(bubble);

            this.tweens.add({
              targets: bubble,
              y: GAME_HEIGHT + 50,
              rotation: Phaser.Math.FloatBetween(-3, 3),
              duration: 400,
              ease: 'Power2',
              onComplete: () => {
                this.bubblePool.release(bubble);
              }
            });
          });
        });

        this.particles.createScorePopup(GAME_WIDTH / 2, GAME_HEIGHT / 2, floatingScore);
      }

      // Reset shot counter on successful match
      this.shotsSinceDrop = 0;
      this.ui.updateShotCounter(SHOTS_BEFORE_DROP);

      this.time.delayedCall(floating.length * 20 + 200, () => {
        this.finishTurn();
      });
    });
  }

  checkShotCounter() {
    this.ui.updateShotCounter(SHOTS_BEFORE_DROP - this.shotsSinceDrop);

    if (this.shotsSinceDrop >= SHOTS_BEFORE_DROP) {
      this.grid.updateActiveColors();

      // Always drop ceiling when shots exhausted
      this.grid.dropCeiling();
      this.ui.showWarning('PUSH!');
      this.characters.panic();

      if (this.sound_mgr) {
        this.sound_mgr.playSFX('newRow');
        this.sound_mgr.playSFX('warning');
      }

      this.shotsSinceDrop = 0;
      this.ui.updateShotCounter(SHOTS_BEFORE_DROP);
    }
  }

  finishTurn() {
    // Check win condition
    if (this.grid.checkWin()) {
      this.characters.celebrate();
      this.particles.createWinEffect();
      if (this.sound_mgr) {
        this.sound_mgr.stopMusic();
        this.sound_mgr.playSFX('levelComplete');
        this.sound_mgr.playSFX('celebrate');
      }

      this.time.delayedCall(1200, () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          level: this.currentLevel,
          won: true
        });
      });
      return;
    }

    // Check game over
    if (this.grid.checkGameOver()) {
      this.characters.defeat();
      this.ui.showWarning('GAME OVER');
      if (this.sound_mgr) {
        this.sound_mgr.stopMusic();
        this.sound_mgr.playSFX('gameOver');
      }

      this.time.delayedCall(1200, () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          level: this.currentLevel,
          won: false
        });
      });
      return;
    }

    // Check danger zone
    const lowestBubbleY = this.getLowestBubbleY();
    if (lowestBubbleY > PLAYFIELD_BOTTOM - 80) {
      this.characters.setMood('worried');
      if (this.sound_mgr) this.sound_mgr.playSFX('worry');
    } else {
      this.characters.setMood('happy');
    }

    this.loadNextBubble();
    this.isProcessing = false;
  }

  getLowestBubbleY() {
    let lowest = 0;
    this.grid.bubbles.getChildren().forEach(bubble => {
      if (bubble.active && bubble.y > lowest) {
        lowest = bubble.y;
      }
    });
    return lowest;
  }

  update() {
    if (this.flyingBubble && this.flyingBubble.active) {
      if (this.flyingBubble.y <= PLAYFIELD_TOP + BUBBLE_RADIUS) {
        this.handleCeilingHit();
      }
    }
  }
}
