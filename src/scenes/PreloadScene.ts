import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";
import { ART, BURHAN_ANIMS, type ArtEntry } from "../assets/manifest";
import { ensureCharacterTextures } from "../assets/placeholders";

/**
 * Loading scene. Drop-in asset pipeline: we first load `sprites/assets.json`
 * (written by the asset generator) listing which illustrated PNGs are present,
 * then queue only those — so there are zero 404s while art is still being made.
 * Anything missing falls back to procedural art (placeholders.ts + per-module
 * vector draws), so the game is always fully playable. Burhan animations are
 * registered from his atlas if it loaded, otherwise BurhanActor is tween-driven.
 */
export class PreloadScene extends Phaser.Scene {
  private spinner?: Phaser.GameObjects.Graphics;

  constructor() {
    super("Preload");
  }

  preload() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const spinner = this.add.graphics({ x: cx, y: cy });
    const drawArc = (angle: number) => {
      spinner.clear();
      spinner.lineStyle(14, COLORS.play, 1);
      spinner.beginPath();
      spinner.arc(0, 0, 60, angle, angle + Math.PI * 1.4, false);
      spinner.strokePath();
    };
    drawArc(0);
    this.tweens.addCounter({
      from: 0,
      to: Math.PI * 2,
      duration: 900,
      repeat: -1,
      onUpdate: (t) => drawArc(t.getValue() ?? 0),
    });
    this.spinner = spinner;

    // Discover which illustrated assets exist, then queue only those. If the
    // list itself is absent (no art generated yet) we simply load nothing.
    this.load.json("__assets", "sprites/assets.json");
    this.load.once("filecomplete-json-__assets", () => {
      const present = new Set<string>(
        (this.cache.json.get("__assets") as string[]) ?? [],
      );
      for (const a of ART) {
        if (present.has(a.key)) this.queue(a);
      }
    });
  }

  private queue(a: ArtEntry) {
    if (a.type === "atlas" && a.atlasJson) {
      this.load.atlas(a.key, a.path, a.atlasJson);
    } else {
      this.load.image(a.key, a.path);
    }
  }

  create() {
    // Characters must always have a texture (real atlas wins; else placeholder).
    ensureCharacterTextures(this);
    this.registerBurhanAnims();

    this.time.delayedCall(700, () => {
      this.spinner?.destroy();
      this.scene.start("Title");
    });
  }

  /**
   * Build Burhan's animations from his atlas frames, but only the ones whose
   * frames are all present. If the atlas didn't load (placeholder single-frame
   * texture), skip — BurhanActor detects missing anims and uses tweens instead.
   */
  private registerBurhanAnims() {
    const tex = this.textures.get("burhan");
    const have = new Set(tex.getFrameNames());
    if (have.size === 0) return; // single-frame placeholder

    for (const [name, def] of Object.entries(BURHAN_ANIMS)) {
      const key = `burhan-${name}`;
      if (this.anims.exists(key)) continue;
      if (!def.frames.every((f) => have.has(f))) continue;
      this.anims.create({
        key,
        frames: def.frames.map((f) => ({ key: "burhan", frame: f })),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
  }
}
