# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Poodle Bobble game built with Phaser 3 and Vite. Features 30 levels, scoring system, particle effects, and responsive design.

## Commands

```bash
npm install     # Install dependencies
npm start       # Start dev server (http://localhost:5173)
npm run build   # Build for production
npm run preview # Preview production build
```

## Architecture

```
src/
  main.js                    # Phaser config, scene registration
  config/
    constants.js             # Game tuning values (sizes, speeds, scoring)
    levels.js                # Level definitions and procedural generation
  scenes/
    BootScene.js             # Asset loading, texture generation
    MenuScene.js             # Title screen, level select
    GameScene.js             # Main gameplay loop
    GameOverScene.js         # Results screen
  objects/
    BubblePool.js            # Object pooling for performance
    Grid.js                  # Hexagonal grid, match detection, floating detection
    Launcher.js              # Aiming, trajectory preview, shooting
    ParticleManager.js       # Pop effects, score popups, combos
    UI.js                    # Score, lives, next bubble preview, shot counter
```

## Key Systems

**Scene Flow**: Boot → Menu → Game → GameOver (with level/retry options)

**Game Loop**: aim → shoot → snap to grid → find matches → pop 3+ → drop floaters → check win/lose → load next bubble

**Grid System**: Hexagonal layout with alternating row offsets. Odd rows have 7 columns (offset by BUBBLE_RADIUS), even rows have 8. Neighbor lookup uses different offset arrays per row parity.

**Scoring**: Base 30 for 3-match + 20 per extra bubble + 100 per floating bubble dropped

**Difficulty Progression**: Shots counter (8 shots → ceiling drop or new row). Lives system (5 lives, lose on missed matches). Bubble colors limited to those on screen.

**Object Pooling**: BubblePool pre-creates 150 bubbles, reuses them via get/release to avoid GC during gameplay.
