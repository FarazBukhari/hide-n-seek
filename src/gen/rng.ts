// Small seeded RNG (mulberry32) so a house layout is reproducible from a seed —
// handy for debugging ("replay that exact house") and for guaranteeing variety
// by avoiding the most recent seed.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  readonly seed: number;
  private next: () => number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }

  float(): number {
    return this.next();
  }

  /** Inclusive integer in [min, max]. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  /** In-place Fisher–Yates shuffle; returns the same array for chaining. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

let lastSeed = -1;

/** A fresh random seed, never equal to the previous one (so houses differ). */
export function nextSeed(): number {
  let s: number;
  do {
    s = (Math.random() * 0xffffffff) >>> 0;
  } while (s === lastSeed);
  lastSeed = s;
  return s;
}
