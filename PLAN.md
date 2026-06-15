# Where's Burhan — Game Plan

A hide-and-seek game for a 4–5 year old. The player closes their eyes while
**Burhan** hides somewhere in a procedurally generated house, then searches
room by room to find him. **No text anywhere** — the game is driven entirely by
pictures, animation, and sound.

---

## 1. Core design decisions

### 2D, not 3D
We'll build this in **2D**. Reasons:
- A 4–5 year old reads pictures, not perspective. Flat, bright, cartoon rooms
  are instantly legible; tapping a cupboard to open it is obvious.
- 2D is far cheaper to build, animate, and procedurally generate.
- Runs smoothly on any phone with tiny download size and battery cost.
- The hint mechanic (a peeking elbow, a wobbling curtain, a giggle) is much
  easier to read clearly in 2D.

3D would multiply the art, performance, and dev cost for no real benefit to the
target player.

### Tech stack
| Layer | Choice | Why |
|---|---|---|
| Engine | **Phaser 3** | Purpose-built 2D web game engine: sprites, frame animation, audio, tap/touch input, scene management. |
| Language/build | **Vite + TypeScript** | Instant hot-reload dev, tiny output, one-command build. Types catch mistakes early. |
| Web hosting (testing) | **GitHub Pages** via GitHub Actions | Every push auto-deploys a URL you can open on your phone in seconds. Fastest possible test loop from the Claude Code phone app. |
| **Android APK** | **Capacitor** | Wraps the exact same web build into a native Android app and produces an `.apk`/`.aab`. One codebase → web + Android. |
| APK CI | GitHub Actions (Android build job) | Produces a downloadable APK artifact on each release tag — no local Android Studio needed. |

**Why this combo:** you get an instant web URL to test on the phone during
development *and* a real Android APK as the final deliverable, from a single
TypeScript codebase. This directly serves "easy to deploy and test on a phone"
plus "the end goal is an Android APK."

---

## 2. Game flow (state machine)

```
Boot ──> Preload ──> Title ──> Countdown ──> Search ──> Result ──┐
                       ^                                          │
                       └──────────── (play again) ───────────────┘
```

1. **Boot / Preload** — load sprites, audio, fonts (icon font only, no words).
2. **Title** — big animated Burhan, a single pulsing ▶ Play button. Tap to start.
3. **Countdown** ("close your eyes")
   - Screen goes dark/blank.
   - A large **10 → 0** countdown shown as *dots/numerals as pictures* plus a
     ticking sound. (Numbers 0–10 are fine even for non-readers; we can also use
     shrinking dots to be safe.)
   - During this time the game **picks a random hiding spot** for Burhan.
4. **Search**
   - One room shown at a time.
   - Player taps **hiding spots** (cupboard, under bed, behind curtain, etc.) to
     check them. Each opens with an animation.
   - Player **navigates** between rooms by tapping doors / corridor arrows.
   - Limited number of "checks" (default **3 wrong checks** before the round ends
     — tunable). A row of hearts/star icons shows tries left (picture, no text).
   - Burhan emits **hints** (see §4).
5. **Result**
   - **Found:** Burhan pops out laughing, confetti, happy music, hug animation.
   - **Out of tries:** Burhan pops out from his spot waving (gentle, not a
     "you lose" — keep it warm), then back to Title.

All transitions are tap-driven with audio feedback. No reading required.

---

## 3. Procedural house generation

Goal: a different house most rounds, with a guaranteed-solvable layout.

**Approach — room graph + furnished rooms:**
1. **Layout generator** builds a small connected graph of rooms (e.g. 3–6 rooms:
   bedroom, kitchen, living room, bathroom, hallway). Rooms are nodes; doors are
   edges. Guarantee the graph is connected so every room is reachable.
2. **Room templates** — each room type has a hand-made background and a set of
   **hiding-spot slots** (e.g. bedroom: under-bed, wardrobe, toy chest, curtain).
   The generator randomly enables a subset and positions Burhan-sized props.
3. **Hiding spot selection** — at countdown, pick one valid spot across the whole
   house at random (weighted so it's age-appropriate — not *too* obscure).
4. **Seeded RNG** — each round gets a seed so a layout is reproducible for
   debugging and we can guarantee variety (avoid repeating the last few seeds).

If full procedural generation proves finicky early on, the fallback is a library
of **several hand-authored houses** chosen at random — same player experience,
less generation code. We'll start with a small procedural generator and a couple
of templates per room, which already yields high variety.

---

## 4. Hint system (NO TEXT, child-friendly)

Hints escalate over time / with wrong guesses so the child always eventually wins:

- **Audio giggle, directional & by proximity** — Burhan laughs periodically. The
  laugh is **louder / more frequent the closer the current room is** to his
  hiding room. Quiet & rare when far, excited when you're in the right room.
- **Brief "peek" animation** — every so often the correct hiding spot does a
  tiny tell: a curtain wobbles, an elbow/foot pokes out for ~0.5s, the wardrobe
  door jiggles. Only the *correct* spot does this.
- **Warm/cold glow** — optional gentle highlight: the room gets a faint warm tint
  when Burhan is in it, cool when not. (Color-only, no words.)
- **Escalation:** after each wrong check, hints get stronger (more frequent
  giggles, bigger peek) so a young child isn't stuck.

We'll make hint intensity and the number-of-tries values **config constants** so
they're easy to tune once you playtest with Burhan's family.

---

## 5. Art & audio assets

### Burhan likeness
- You'll provide photos. We'll create an **animated cartoon sprite** of him:
  a small, friendly 2D character with a few animations (idle, peek, giggle,
  pop-out/celebrate, run between rooms).
- Until photos arrive, we build with a **placeholder kid sprite** so all the
  mechanics work; swapping in the real Burhan art is then a drop-in asset change.
- Art produced as a **sprite sheet** (PNG + atlas JSON) — standard Phaser format.

### Other art
- Bright, simple room backgrounds (one per room type, a couple of variants).
- Hiding-spot props with open/closed + "peek" frames.
- Icon-only UI: Play ▶, hearts/tries, replay ↻.

### Audio
- Burhan giggle/laugh set, "found you!" sting, gentle ticking for countdown,
  happy win music, soft ambient. All royalty-free or original; no spoken words.

---

## 6. Project structure (proposed)

```
wheres-burhan/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ capacitor.config.ts          # Android wrapper config
├─ android/                     # generated by Capacitor
├─ public/assets/               # sprites, audio, atlases
├─ src/
│  ├─ main.ts                   # Phaser game bootstrap
│  ├─ config.ts                 # tunables: tries, hint intensity, timer
│  ├─ scenes/
│  │  ├─ BootScene.ts
│  │  ├─ PreloadScene.ts
│  │  ├─ TitleScene.ts
│  │  ├─ CountdownScene.ts
│  │  ├─ SearchScene.ts
│  │  └─ ResultScene.ts
│  ├─ gen/
│  │  ├─ houseGenerator.ts      # room graph + furnishing
│  │  └─ roomTemplates.ts
│  ├─ systems/
│  │  ├─ hintSystem.ts
│  │  └─ rng.ts                 # seeded random
│  └─ objects/
│     ├─ Burhan.ts
│     └─ HidingSpot.ts
└─ .github/workflows/
   ├─ deploy-pages.yml          # web → GitHub Pages on push
   └─ build-apk.yml             # APK artifact on tag/manual
```

---

## 7. Roadmap / milestones

**M1 — Skeleton & deploy pipeline**
- Vite + Phaser + TS project, Title → Countdown → Search → Result scenes wired
  with placeholder art.
- GitHub Pages auto-deploy working → you get a live phone-testable URL.

**M2 — Core loop (one hand-made house)**
- Single furnished house, tap hiding spots, win/lose, tries counter.
- Countdown with eyes-closed blank screen + random hiding spot.

**M3 — Hints**
- Proximity giggles + peek animations + escalation. Playtest feel.

**M4 — Procedural houses**
- Room-graph generator + room templates for variety each round.

**M5 — Burhan art pass**
- Swap placeholder for the real animated Burhan sprite from your photos.
- Audio pass (giggles, music, SFX).

**M6 — Android APK**
- Add Capacitor, configure Android, CI job producing a downloadable APK.
- Icon, splash, app name. Sideload-test on a phone.

Each milestone is independently testable on your phone via the Pages URL.

---

## 8. Open questions for you
1. **Tries:** default to **3 wrong checks** per round? (Easy to change.)
2. **Countdown length:** keep at **10s**, or shorter for a young child?
3. **Numbers on screen:** OK to show numerals 10→0, or prefer purely
   picture-based (shrinking dots) since he can't read yet?
4. **APK distribution:** just sideload the APK to family phones, or eventually
   Google Play? (Affects signing setup later — not needed for M1–M5.)
5. **Photos of Burhan:** how will you share them (commit to repo / link)? We can
   start building immediately with a placeholder regardless.
