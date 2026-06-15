// ---------------------------------------------------------------------------
// Tiny Web Audio synth for wordless sound effects. M2 uses these synthesized
// blips so the game has audio feedback without shipping binary audio files yet;
// real recorded giggles / music get swapped in at M5 (drop-in replacement).
//
// Browsers block audio until a user gesture, so call `unlock()` from the first
// tap (the Title play button).
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  return ctx;
}

/** Resume the audio context. Call from the first user tap. */
export function unlock() {
  const c = ensure();
  if (c && c.state === "suspended") void c.resume();
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

/** A single oscillator note. `pan` in [-1, 1] for the spatial hint (M4). */
function note(
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; pan?: number } = {},
) {
  const c = ensure();
  if (!c || !master || !enabled) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.value = freq;

  const peak = opts.gain ?? 0.3;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  let tail: AudioNode = g;
  if (opts.pan !== undefined && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, opts.pan));
    g.connect(p);
    tail = p;
  }
  osc.connect(g);
  tail.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Soft countdown tick. */
export function playTick() {
  note(660, 0, 0.08, { type: "square", gain: 0.12 });
}

/** A child-like giggle: a few quick wobbling blips. `intensity` 0..1, `pan` for direction. */
export function playGiggle(intensity = 1, pan = 0) {
  const base = 520;
  const steps = [0, 1, -1, 2, 0];
  const gain = 0.1 + 0.18 * intensity;
  steps.forEach((s, i) => {
    note(base + s * 70 + Math.random() * 20, i * 0.09, 0.1, {
      type: "triangle",
      gain,
      pan,
    });
  });
}

/** Happy "found you!" ascending arpeggio. */
export function playFound() {
  [523, 659, 784, 1047].forEach((f, i) =>
    note(f, i * 0.12, 0.22, { type: "triangle", gain: 0.32 }),
  );
}

/** Gentle "nope" for a wrong check. */
export function playNope() {
  note(300, 0, 0.12, { type: "sine", gain: 0.22 });
  note(220, 0.1, 0.16, { type: "sine", gain: 0.22 });
}

/** Soft "shhh" noise burst for the hide phase. */
export function playShhh() {
  const c = ensure();
  if (!c || !master || !enabled) return;
  const dur = 0.6;
  const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3000;
  const g = c.createGain();
  g.gain.value = 0.12;
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start();
}
