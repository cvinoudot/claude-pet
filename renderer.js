// ============================================================
//  Claude Pet — renderer.js  v2
//  Proper pixel art cat & rabbit
// ============================================================

const canvas = document.getElementById('pet-canvas');
const ctx    = canvas.getContext('2d');
const xpBar  = document.getElementById('xp-bar');
const bubble = document.getElementById('speech-bubble');

const SCALE    = 5;
const CANVAS_W = 140;
const CANVAS_H = 130;
const FPS      = 8;

// ---- Drawing primitives ----
function dot(x, y, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
}
function row(y, x1, x2, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x1 * SCALE, y * SCALE, (x2 - x1 + 1) * SCALE, SCALE);
}
function col(x, y1, y2, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x * SCALE, y1 * SCALE, SCALE, (y2 - y1 + 1) * SCALE);
}
function block(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
}
function clear() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
}

// ---- Colour palettes ----
const PAL = {
  cat: {
    orange: {
      B:'#F4900C', D:'#A85800', W:'#FFFDF5',
      P:'#FFAAB5', E:'#2C1654', H:'#FFFFFF',
      N:'#FF5577', whisker:'#996633', tail:'#E07A00'
    },
    bw: {
      B:'#1C1C1C', D:'#000000', W:'#FFFFFF',
      P:'#CC7788', E:'#228822', H:'#AAFFAA',
      N:'#FF88AA', whisker:'#888888', tail:'#333333'
    }
  },
  rabbit: {
    white: {
      B:'#E8F4FF', D:'#99BBDD', W:'#FFFFFF',
      P:'#FFAABB', E:'#3355CC', H:'#CCDDFF',
      N:'#FF88AA'
    },
    grey: {
      B:'#BBBBBB', D:'#777777', W:'#EEEEEE',
      P:'#FFAACC', E:'#222266', H:'#AAAAFF',
      N:'#FF88BB'
    }
  }
};

// ---- CAT SPRITE ----
// 14 px wide × 17 px tall (logical), positioned at (ox, oy)
function drawCat(ox, oy, p, stage, frame, mood) {
  const blink   = frame % 24 < 2;
  const sleeping = mood === 'sleep';
  const happy   = mood === 'happy' || mood === 'excited';
  const curious = mood === 'curious';
  const nervous = mood === 'nervous';
  const walking = mood === 'walk';

  const bounce = happy && frame % 4 < 2 ? -1 : 0;
  oy += bounce;

  // tail wag  −1 / 0 / +1
  const tw = [-1, 0, 1][Math.floor(frame / 4) % 3];

  // ── EARS ──────────────────────────────────────────────────
  // left ear (triangle pointing up-left)
  dot(ox+2, oy,   p.D);
  dot(ox+1, oy+1, p.D); dot(ox+2, oy+1, p.B); dot(ox+3, oy+1, p.D);
  dot(ox+1, oy+2, p.B); dot(ox+2, oy+2, p.P); dot(ox+3, oy+2, p.B);
  // right ear
  dot(ox+11, oy,   p.D);
  dot(ox+10, oy+1, p.D); dot(ox+11, oy+1, p.B); dot(ox+12, oy+1, p.D);
  dot(ox+10, oy+2, p.B); dot(ox+11, oy+2, p.P); dot(ox+12, oy+2, p.B);

  // ── HEAD ──────────────────────────────────────────────────
  row(oy+3, ox+1, ox+12, p.B);
  row(oy+4, ox+0, ox+13, p.B);

  // tabby forehead stripes
  if (p.D !== '#000000') {
    dot(ox+3, oy+3, p.D); dot(ox+7, oy+3, p.D); dot(ox+10, oy+3, p.D);
  }

  // ── MUZZLE / FACE ─────────────────────────────────────────
  // face sides (body colour)
  for (let r = 5; r <= 9; r++) {
    dot(ox+0, oy+r, p.B); dot(ox+1, oy+r, p.B); dot(ox+2, oy+r, p.B);
    dot(ox+11, oy+r, p.B); dot(ox+12, oy+r, p.B); dot(ox+13, oy+r, p.B);
  }
  // white muzzle centre
  block(ox+3, oy+5, 8, 5, p.W);
  row(oy+9, ox+1, ox+12, p.B); // chin (override muzzle bottom row)
  block(ox+3, oy+9, 8, 1, p.W); // keep inner chin white

  // ── EYES ──────────────────────────────────────────────────
  if (sleeping) {
    // closed arcs
    row(oy+6, ox+3, ox+5, p.E);
    row(oy+6, ox+8, ox+10, p.E);
  } else if (blink) {
    row(oy+7, ox+3, ox+5, p.E);
    row(oy+7, ox+8, ox+10, p.E);
  } else {
    // left eye 3×3
    block(ox+3, oy+5, 3, 3, p.E);
    dot(ox+3, oy+5, p.H);          // gleam
    // right eye 3×3
    block(ox+8, oy+5, 3, 3, p.E);
    dot(ox+8, oy+5, p.H);

    if (happy) {
      // arc eyes: remove bottom corners → looks like ^_^
      dot(ox+3, oy+7, p.W); dot(ox+5, oy+7, p.W);
      dot(ox+8, oy+7, p.W); dot(ox+10, oy+7, p.W);
    }
    if (curious) {
      // wide eyes: extra row above
      row(oy+4, ox+3, ox+5, p.E);
      row(oy+4, ox+8, ox+10, p.E);
    }
    if (nervous) {
      // worried slant: small diagonal
      dot(ox+5, oy+5, p.W);
      dot(ox+10, oy+5, p.W);
    }
  }

  // ── NOSE & MOUTH ──────────────────────────────────────────
  dot(ox+6, oy+8, p.N); dot(ox+7, oy+8, p.N);
  // mouth
  dot(ox+5, oy+9, p.D); dot(ox+8, oy+9, p.D);
  if (happy) { dot(ox+6, oy+9, p.D); dot(ox+7, oy+9, p.D); }

  // ── WHISKERS (thin 1-pixel canvas lines) ──────────────────
  ctx.fillStyle = p.whisker;
  // left side
  ctx.fillRect((ox-3)*SCALE, oy*SCALE*1 + 7*SCALE + 2, 3*SCALE, 1);
  ctx.fillRect((ox-3)*SCALE, oy*SCALE*1 + 8*SCALE + 2, 3*SCALE, 1);
  // right side
  ctx.fillRect((ox+14)*SCALE, oy*SCALE*1 + 7*SCALE + 2, 3*SCALE, 1);
  ctx.fillRect((ox+14)*SCALE, oy*SCALE*1 + 8*SCALE + 2, 3*SCALE, 1);

  // ── BODY ──────────────────────────────────────────────────
  row(oy+10, ox+1, ox+12, p.B);
  row(oy+11, ox+0, ox+13, p.B);
  row(oy+12, ox+0, ox+13, p.B);
  row(oy+13, ox+1, ox+12, p.B);
  // belly
  block(ox+3, oy+10, 8, 4, p.W);
  // body shadow edges
  dot(ox+0, oy+11, p.D); dot(ox+13, oy+11, p.D);
  dot(ox+0, oy+12, p.D); dot(ox+13, oy+12, p.D);

  // ── FRONT PAWS ────────────────────────────────────────────
  const pb = walking && frame % 6 < 3 ? 1 : 0; // right paw bobs
  row(oy+14, ox+1, ox+4, p.B); row(oy+15, ox+1, ox+4, p.B);
  dot(ox+1, oy+15, p.D); dot(ox+3, oy+15, p.D);          // left toes
  row(oy+14-pb, ox+9, ox+12, p.B); row(oy+15-pb, ox+9, ox+12, p.B);
  dot(ox+9, oy+15-pb, p.D); dot(ox+11, oy+15-pb, p.D);   // right toes

  // ── TAIL (curves right, wags up/down) ─────────────────────
  const ty = oy + 11 + tw;
  dot(ox+13, ty,   p.tail || p.B);
  dot(ox+14, ty-1, p.tail || p.B); dot(ox+14, ty, p.tail || p.B);
  dot(ox+15, ty-2, p.tail || p.B); dot(ox+15, ty-1, p.tail || p.B);
  // tip
  dot(ox+15, ty-3, p.W); dot(ox+14, ty-3, p.W);

  // ── ADULT ACCESSORY: bow ───────────────────────────────────
  if (stage === 'adult') {
    dot(ox+5, oy+2, '#FF3388');
    dot(ox+6, oy+1, '#FF3388');
    dot(ox+7, oy+2, '#FF3388');
    dot(ox+6, oy+2, '#FFAACC');
  }

  // ── MOOD FX ───────────────────────────────────────────────
  if (happy)   drawSparkles(ox, oy, frame, '#FFD700');
  if (nervous) drawSweat(ox+15, oy+3);
  if (sleeping) drawZzz(ox+15, oy, frame);
  if (curious) drawThinkDots(ox-2, oy, frame);
}

// ---- RABBIT SPRITE ----
// 14 px wide × 19 px tall
function drawRabbit(ox, oy, p, stage, frame, mood) {
  const blink   = frame % 20 < 2;
  const sleeping = mood === 'sleep';
  const happy   = mood === 'happy' || mood === 'excited';
  const curious = mood === 'curious';
  const nervous = mood === 'nervous';
  const walking = mood === 'walk';

  const bounce = happy && frame % 4 < 2 ? -2 : 0;
  oy += bounce;
  const ew = Math.floor(frame / 8) % 2; // ear wiggle

  // ── EARS (long, upright, iconic rabbit!) ──────────────────
  // left ear column
  for (let r = 0; r <= 5; r++) {
    dot(ox+3, oy+r, p.B);
    dot(ox+4, oy+r, p.B);
  }
  // inner ear pink
  for (let r = 1; r <= 4; r++) dot(ox+4, oy+r, p.P);
  // ear tip wiggle
  dot(ox+3+ew, oy, p.D); dot(ox+4+ew, oy, p.D);

  // right ear column
  for (let r = 0; r <= 5; r++) {
    dot(ox+9,  oy+r, p.B);
    dot(ox+10, oy+r, p.B);
  }
  for (let r = 1; r <= 4; r++) dot(ox+9, oy+r, p.P);
  dot(ox+9-ew, oy, p.D); dot(ox+10-ew, oy, p.D);

  // ── HEAD ──────────────────────────────────────────────────
  row(oy+6,  ox+2, ox+11, p.B);
  row(oy+7,  ox+1, ox+12, p.B);
  row(oy+8,  ox+1, ox+12, p.B);
  row(oy+9,  ox+1, ox+12, p.B);
  row(oy+10, ox+2, ox+11, p.B);

  // ── FACE ──────────────────────────────────────────────────
  block(ox+3, oy+7, 8, 3, p.W);
  for (let r = 7; r <= 9; r++) {
    dot(ox+1, oy+r, p.B); dot(ox+2, oy+r, p.B);
    dot(ox+11, oy+r, p.B); dot(ox+12, oy+r, p.B);
  }

  // ── EYES ──────────────────────────────────────────────────
  if (sleeping || blink) {
    row(oy+7, ox+3, ox+5, p.E);
    row(oy+7, ox+8, ox+10, p.E);
  } else {
    block(ox+3, oy+7, 3, 3, p.E); dot(ox+3, oy+7, p.H);
    block(ox+8, oy+7, 3, 3, p.E); dot(ox+8, oy+7, p.H);
    if (happy) {
      dot(ox+3, oy+9, p.W); dot(ox+5, oy+9, p.W);
      dot(ox+8, oy+9, p.W); dot(ox+10, oy+9, p.W);
    }
    if (curious) {
      row(oy+6, ox+3, ox+5, p.E);
      row(oy+6, ox+8, ox+10, p.E);
    }
  }

  // ── NOSE & CHEEKS ─────────────────────────────────────────
  dot(ox+6, oy+9, p.N); dot(ox+7, oy+9, p.N);
  dot(ox+2, oy+9, '#FFCCDD'); // blush
  dot(ox+11, oy+9, '#FFCCDD');

  // ── BODY ──────────────────────────────────────────────────
  row(oy+11, ox+1, ox+12, p.B);
  row(oy+12, ox+0, ox+13, p.B);
  row(oy+13, ox+0, ox+13, p.B);
  row(oy+14, ox+1, ox+12, p.B);
  block(ox+3, oy+11, 8, 4, p.W); // belly

  // ── FEET ──────────────────────────────────────────────────
  const hop = walking && frame % 6 < 3 ? -1 : 0;
  // left foot (rounder / longer)
  row(oy+15, ox+1, ox+5, p.B);
  row(oy+16, ox+0, ox+5, p.B);
  // right foot
  row(oy+15+hop, ox+8, ox+12, p.B);
  row(oy+16+hop, ox+8, ox+13, p.B);

  // ── FLUFFY TAIL ───────────────────────────────────────────
  block(ox+13, oy+12, 2, 2, '#FFFFFF');

  // ── ADULT ACCESSORY: bow ───────────────────────────────────
  if (stage === 'adult') {
    dot(ox+5, oy+6, '#FF3388');
    dot(ox+6, oy+5, '#FF3388');
    dot(ox+7, oy+6, '#FF3388');
    dot(ox+6, oy+6, '#FFAACC');
  }

  // ── MOOD FX ───────────────────────────────────────────────
  if (happy)   drawSparkles(ox, oy-2, frame, '#AADDFF');
  if (nervous) drawSweat(ox+14, oy+4);
  if (sleeping) drawZzz(ox+14, oy+1, frame);
  if (curious) drawThinkDots(ox-2, oy+2, frame);
}

// ---- Mood effect overlays ----
function drawSparkles(ox, oy, frame, color) {
  const positions = [[-2, 3], [15, 3], [-2, 9], [15, 9]];
  ctx.fillStyle = color;
  positions.forEach(([dx, dy], i) => {
    if ((frame + i * 3) % 8 < 4) {
      ctx.fillRect((ox+dx)*SCALE, (oy+dy)*SCALE, SCALE, SCALE);
    }
  });
}

function drawSweat(ox, oy) {
  ctx.fillStyle = '#88CCFF';
  ctx.fillRect(ox*SCALE, oy*SCALE, SCALE, SCALE);
  ctx.fillRect(ox*SCALE, (oy+1)*SCALE, SCALE, SCALE*2);
}

function drawZzz(ox, oy, frame) {
  ctx.fillStyle = '#AACCFF';
  ctx.font = `${SCALE * 2}px monospace`;
  const phase = frame % 18;
  if (phase < 6)       ctx.fillText('z', ox*SCALE, (oy+2)*SCALE);
  else if (phase < 12) ctx.fillText('z', (ox+1)*SCALE, (oy+1)*SCALE);
  else                 ctx.fillText('Z', (ox+2)*SCALE, oy*SCALE);
}

function drawThinkDots(ox, oy, frame) {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${SCALE}px monospace`;
  const n = Math.floor(frame / 6) % 3 + 1;
  ctx.fillText('.'.repeat(n), ox*SCALE, (oy+1)*SCALE);
}

// ---- XP & stage ----
function xpToStage(xp) {
  if (xp >= 500) return 'adult';
  if (xp >= 100) return 'teen';
  return 'baby';
}
function xpProgress(xp) {
  if (xp >= 500) return { cur: xp - 500, max: Infinity };
  if (xp >= 100) return { cur: xp - 100, max: 400 };
  return { cur: xp, max: 100 };
}

// Stage affects which palette variant we use (baby = softer, teen/adult = richer)
// For simplicity we use the same palette and just vary accessory

// ---- Speech bubbles (English) ----
const SAYINGS = {
  happy:   ['OwO!', 'Yay!', '^_^', 'Purrr~', 'So happy!'],
  excited: ['WOW!', 'More code!', "Let's go!", 'Amazing!', '!!!'],
  nervous: ['Uh oh...', 'Careful!', 'bash?!', 'O_O', '!scary!'],
  curious: ['Hmm...', 'Interesting!', "What's this?", 'Reading~', '?!'],
  sleep:   ['Zzz...', '..zZ..', 'Napping~', 'so tired...'],
  eat:     ['Nom nom!', 'Yummy!', 'Thank you!', 'Delicious!'],
  missed:  ['Missed you!', "You're back!", 'Finally!!', 'Meow!!', 'Yay!'],
  levelup: ['LEVEL UP!', '★ ★ ★', 'I grew up!', 'So big now!'],
  walk:    ['la la la~', '*stretching*', 'exploring~', '*yawn*'],
};

function showBubble(key, duration = 2500) {
  const lines = SAYINGS[key] || SAYINGS.happy;
  bubble.textContent = lines[Math.floor(Math.random() * lines.length)];
  bubble.style.display = 'block';
  bubbleTimer = duration;
}

// ---- Pet state ----
let state = { xp: 0, stage: 'baby', type: 'cat', colorVariant: 'orange', lastSeen: Date.now(), moodHistory: [], missedYou: false };
let mood = 'idle';
let moodTimer = 0;
let bubbleTimer = 0;
let animFrame = 0;
let lastFrameTime = 0;
let idleTime = 0;
let walkX = 0;
let walkDir = 1;
let walkSchedule = randomWalkDelay();

function randomWalkDelay() { return 30000 + Math.random() * 60000; }

function updateXPBar() {
  const { cur, max } = xpProgress(state.xp);
  const pct = max === Infinity ? 100 : Math.min(100, Math.round(cur / max * 100));
  xpBar.style.width = pct + '%';
}

function addXP(n) {
  const oldStage = state.stage;
  state.xp += n;
  state.stage = xpToStage(state.xp);
  if (state.stage !== oldStage) setMood('levelup', 4000);
  updateXPBar();
  window.petBridge?.saveState(state);
}

function setMood(m, duration = 3000, say = true) {
  mood = m;
  moodTimer = duration;
  if (say && SAYINGS[m]) showBubble(m, Math.min(duration - 100, 2800));
  state.moodHistory = [m, ...(state.moodHistory || [])].slice(0, 10);
}

// ---- Pet Agent (rule-based) ----
class PetAgent {
  constructor() { this.queue = []; }
  push(e)  { this.queue.push(e); }
  tick()   { return this.queue.length ? this.queue.shift() : null; }

  toolMood(tool) {
    if (!tool) return 'happy';
    const t = tool.toLowerCase();
    if (t === 'write' || t === 'edit' || t === 'notebookedit') return 'excited';
    if (t === 'bash')                                           return 'nervous';
    if (t === 'read' || t === 'grep' || t === 'glob')          return 'curious';
    return 'happy';
  }
}
const agent = new PetAgent();

// ---- Game loop ----
function gameLoop(ts) {
  const delta = ts - lastFrameTime;
  if (delta < 1000 / FPS) { requestAnimationFrame(gameLoop); return; }
  lastFrameTime = ts;
  animFrame++;

  // bubble
  if (bubbleTimer > 0) { bubbleTimer -= delta; if (bubbleTimer <= 0) bubble.style.display = 'none'; }

  // agent events
  const ev = agent.tick();
  if (ev) {
    idleTime = 0;
    if (mood === 'sleep') setMood('happy', 2000);

    if (ev.type === 'tool_use') {
      const m = agent.toolMood(ev.tool_name);
      setMood(m, 2200);
      if (m === 'excited' || m === 'happy') addXP(1);
    } else if (ev.type === 'stop') {
      setMood('happy', 2000);
      addXP(1);
    } else if (ev.type === 'feed')   { setMood('eat', 2500); }
      else if (ev.type === 'pet')    { setMood('happy', 2000); }
      else if (ev.type === 'missed') { setMood('missed', 3500); }
  }

  // idle/sleep
  idleTime += delta;
  if (idleTime > 10 * 60 * 1000 && mood !== 'sleep') setMood('sleep', Infinity);

  // mood timer
  if (mood !== 'sleep') {
    if (moodTimer !== Infinity) moodTimer -= delta;
    if (moodTimer <= 0) {
      walkSchedule -= delta;
      if (walkSchedule <= 0) {
        setMood('walk', 5000, true);
        walkDir = Math.random() < 0.5 ? 1 : -1;
        walkSchedule = randomWalkDelay();
      } else {
        mood = 'idle';
        moodTimer = 0;
      }
    }
  }

  // walk movement
  if (mood === 'walk') {
    walkX += walkDir * 0.6;
    if (walkX > 6 || walkX < -6) walkDir *= -1;
  }

  // ── DRAW ──────────────────────────────────────────────────
  clear();

  const petType = state.type === 'rabbit' ? 'rabbit' : 'cat';
  const variant = state.colorVariant || (petType === 'cat' ? 'orange' : 'white');
  const pal     = PAL[petType][variant];
  const stg     = state.stage || 'baby';
  const ox      = Math.round(3 + walkX);
  const oy      = 2;

  if (petType === 'cat')    drawCat(ox, oy, pal, stg, animFrame, mood);
  else                      drawRabbit(ox, oy, pal, stg, animFrame, mood);

  requestAnimationFrame(gameLoop);
}

// ---- Init ----
function init(saved) {
  if (saved) {
    state = saved;
    state.stage = xpToStage(state.xp);
  }
  updateXPBar();

  const hoursSince = (Date.now() - (state.lastSeen || Date.now())) / 3600000;
  if (state.missedYou || hoursSince > 2) {
    setTimeout(() => agent.push({ type: 'missed' }), 1200);
    state.missedYou = false;
  }
  state.lastSeen = Date.now();
  window.petBridge?.saveState(state);

  requestAnimationFrame(gameLoop);
}

// ---- Bridge ----
if (window.petBridge) {
  window.petBridge.onInitState(s  => init(s));
  window.petBridge.onClaudeEvent(e => agent.push(e));
} else {
  // browser preview mode
  init(null);
}

// ---- Mouse / click ----
canvas.addEventListener('mouseenter', () => window.petBridge?.mouseEnter());
canvas.addEventListener('mouseleave', () => window.petBridge?.mouseLeave());

canvas.addEventListener('click', () => {
  idleTime = 0;
  if (mood === 'sleep') setMood('happy', 2000);
  else                  setMood('happy', 1800);
});
