import { describe, it, expect } from "vitest";
import { Rng, nextSeed } from "./rng";

describe("Rng", () => {
  it("is deterministic for a given seed", () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 20 }, () => a.float());
    const seqB = Array.from({ length: 20 }, () => b.float());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const r1 = new Rng(1);
    const r2 = new Rng(2);
    const a = Array.from({ length: 20 }, () => r1.int(0, 1e6));
    const b = Array.from({ length: 20 }, () => r2.int(0, 1e6));
    expect(a).not.toEqual(b);
  });

  it("int stays within inclusive bounds and can hit both ends", () => {
    const rng = new Rng(7);
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 5000; i++) {
      const v = rng.int(3, 8);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(8);
      expect(Number.isInteger(v)).toBe(true);
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    expect(min).toBe(3);
    expect(max).toBe(8);
  });

  it("pick returns a member of the array", () => {
    const rng = new Rng(99);
    const arr = ["a", "b", "c", "d"];
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  it("shuffle preserves length and elements", () => {
    const rng = new Rng(42);
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = rng.shuffle([...arr]);
    expect(copy).toHaveLength(arr.length);
    expect([...copy].sort((x, y) => x - y)).toEqual(arr);
  });
});

describe("nextSeed", () => {
  it("never returns the same seed twice in a row", () => {
    let prev = nextSeed();
    for (let i = 0; i < 1000; i++) {
      const s = nextSeed();
      expect(s).not.toBe(prev);
      expect(s).toBeGreaterThanOrEqual(0);
      prev = s;
    }
  });
});
