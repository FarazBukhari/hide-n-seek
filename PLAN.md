# Where's Burhan? — Game Plan

A hide-and-seek game for a 4–5 year old. The player closes their eyes while
**Burhan** hides somewhere in a procedurally generated house, then searches
room by room to find him. **No text anywhere** — the game is driven entirely by
pictures, animation, and sound.

The repo is a clean start: nothing built yet, on branch
`claude/wheres-burhan-game-plan-30gn7s`.

---

## Tech stack (chosen for phone-first deploy & testing)

| Decision | Choice | Why |
|---|---|---|
| Dimension | **2D, hand-illustrated cartoon style** | A drawn likeness of a 4–5 yr old reads as warm and charming; 3D would need modeling/rigging and a likeness is far harder to nail. 2D also runs smoothly on any phone. |
| Engine | **Phaser 3** | Purpose-built 2D web game engine: sprites, frame animation, audio, tap/touch input, and scene management (countdown vs. search) all built in. |
| Build/dev | **Vite + TypeScript** | Instant builds, tiny output, one command to ship. |
| Hosting | **GitHub Pages via GitHub Actions** | This is the key to your phone workflow: I push to the branch → an Action auto-builds and deploys → you open one URL on your phone to play the latest version. No app store, no local server, no cables. |

**Your loop:** I push → GitHub builds it → you open the Pages link in your phone
browser → tap "Add to Home Screen" so it feels like a real app (full-screen,
works offline via PWA).

---

## Game structure (Phaser scenes)

1. **Boot/Loading** — loads art + sounds, shows an animated spinner (no text).
2. **Title** — Burhan waving, a big green ▶ play button. Tap to start.
3. **Hide phase ("close your eyes")** — screen goes dark, large countdown
   10 → 0 (numerals only, plus a shrinking ring so non-readers track it too).
   Behind the scenes the game picks a random room + hiding spot. A gentle "shhh"
   + giggle plays.
4. **Seek phase** — one room shown at a time. Tap hiding spots to check them; tap
   doors/arrows to move between rooms. Limited tries (start at **5**, tunable).
5. **Found! / Out of tries** — celebration: confetti, Burhan jumps out laughing,
   happy music. No "win/lose" text — just joyful vs. a gentle "aww, try again"
   animation. Auto-offer a new round.

---

## Procedural house generation

- A house = a small grid of rooms (e.g. 4–6 rooms: living room, bedroom,
  kitchen, bathroom, hallway), connected by doors.
- Each room is assembled from modular furniture pieces (sofa, bed, curtains,
  cupboard, toy box, plant…), each tagged as a possible hiding spot.
- Each round: randomize which rooms appear, their layout, furniture placement,
  and which spot Burhan picks. With ~6 room templates × randomized furniture,
  every round feels different even before we hand-draw more.
- We start with a solid set of hand-built room templates and layered randomness;
  if we want truly infinite variety later we can add more generators.

---

## Hint system — fully wordless (the fun part)

Layering several non-text hints so a 4–5 yr old always has a clue:

- **Laughter proximity / "warmer–colder":** giggles get louder and more frequent
  the closer the player is to the right room and spot; quieter/sparser when far.
  This is the primary hint.
- **Micro-peeks:** every few seconds the hiding spot Burhan is in does a tiny
  tell — a curtain sways, a cupboard door jiggles, a foot pokes out for a split
  second, then hides again.
- **Spatial audio nudge:** a soft directional giggle hints which door to go
  through (pan left/right).
- **Escalating help:** if the player is struggling (tries running low), hints get
  more obvious so it always ends happily.
- **Tap feedback:** checking a wrong spot gives a soft "nope" bounce + sound; the
  right one triggers the big reveal.

---

## Art & Burhan likeness pipeline

- I'll build everything first with **placeholder cartoon art** so the game is
  fully playable immediately.
- When you send photos, I'll create an **animated-style Burhan**: a base sprite
  plus a few poses (peeking, giggling, jumping out, waving) and swap him in.
  Everything's structured so the art swap is a drop-in.
- **Audio:** gentle kid-friendly giggles, "shhh", tap blips, win fanfare —
  sourced from royalty-free/CC0 libraries.

---

## Milestones

- **M1 – Skeleton & deploy:** Vite+Phaser+TS project, GitHub Pages Action, PWA
  shell. You get a live URL on day one (placeholder visuals).
- **M2 – Core loop:** countdown → seek → found, with one house and tappable
  hiding spots.
- **M3 – Procedural houses:** room templates + randomized furniture/spots +
  room-to-room navigation.
- **M4 – Hint system:** laughter proximity, micro-peeks, escalating help.
- **M5 – Polish:** Burhan likeness, sound design, celebration effects, difficulty
  tuning.

---

## Android APK (your stated end goal — to confirm)

Your liked plan above ships as a **web app / PWA** on GitHub Pages, which is the
fastest test loop. Your opening message said the *end goal* is an Android APK.
These aren't in conflict — the standard path is to wrap the same web build with
**Capacitor** to produce an `.apk`, with a GitHub Actions job building it on
demand. We'd add this as a final step **after M5** without changing anything
above. Flagged here so you can decide whether to include the APK track now or
keep it pure-web for now (see questions below).

---

## A few choices I'd like your call on before I build

1. **Tries:** start at **5** wrong checks per round (tunable)?
2. **Countdown length:** keep at **10s**, or shorter for a young child?
3. **Android APK:** add the Capacitor/APK track (after M5), or stay web/PWA only
   for now?
4. **Difficulty:** gentle (obvious hiding spots, strong escalating hints) to
   start?
5. **Photos of Burhan:** how will you share them? We build with a placeholder
   meanwhile, so this doesn't block anything.
