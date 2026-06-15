import Phaser from "phaser";

/**
 * Minimal first scene. Real asset loading happens in PreloadScene; this exists
 * so we have a clean place for any global setup (input config, scale events)
 * before anything visual appears.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    this.scene.start("Preload");
  }
}
