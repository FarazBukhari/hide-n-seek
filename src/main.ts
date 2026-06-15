import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { TitleScene } from "./scenes/TitleScene";
import { CountdownScene } from "./scenes/CountdownScene";
import { SearchScene } from "./scenes/SearchScene";
import { ResultScene } from "./scenes/ResultScene";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: COLORS.bgDark,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    // Fit the portrait design canvas into any phone screen, letterboxed.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Touch + mouse; multi-touch not needed for tap-only gameplay.
  input: { activePointers: 1 },
  render: { pixelArt: false, antialias: true },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    CountdownScene,
    SearchScene,
    ResultScene,
  ],
});
