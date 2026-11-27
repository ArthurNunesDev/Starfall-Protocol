const DIRECTIONS = Object.freeze(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
const ANIMATIONS = Object.freeze(["idle", "run"]);

function createAtlas() {
  const definitions = {
    idle: { start: 0, count: 6, loop: true, priority: 0, durations: [140, 140, 140, 140, 140, 140] },
    run: { start: 6, count: 8, loop: true, priority: 1, durations: [75, 75, 75, 75, 75, 75, 75, 75] },
  };
  const animations = {};

  for (const [name, definition] of Object.entries(definitions)) {
    const frames = {};
    DIRECTIONS.forEach((direction, directionIndex) => {
      frames[direction] = Array.from({ length: definition.count }, (_, frameIndex) => ({
        x: (definition.start + frameIndex) * 64,
        y: directionIndex * 64,
        w: 64,
        h: 64,
      }));
    });
    animations[name] = {
      loop: definition.loop,
      hold: definition.hold ?? false,
      priority: definition.priority,
      durations: definition.durations,
      frames,
    };
  }

  return { version: 2, image: "soldier.webp", cell: { w: 64, h: 64 },
    pivot: { x: 32, y: 38 }, directions: DIRECTIONS, animations };
}

export async function loadSoldierAssets() {
  const atlas = createAtlas();
  const image = new Image();
  image.src = new URL("../../assets/sprites/soldier.webp", import.meta.url).href;
  try {
    await image.decode();
  } catch (cause) {
    throw new Error("Não foi possível decodificar a spritesheet do operador.", { cause });
  }
  if (image.naturalWidth !== 896 || image.naturalHeight !== 512) {
    throw new Error(`Dimensões inesperadas da spritesheet: ${image.naturalWidth}x${image.naturalHeight}.`);
  }
  return Object.freeze({ atlas, image });
}

export function directionFromAngle(angle) {
  if (!Number.isFinite(angle)) return "S";
  const sector = Math.round((angle + Math.PI / 2) / (Math.PI / 4));
  return DIRECTIONS[((sector % 8) + 8) % 8];
}

export function directionFromVector(dx, dy, current = "S") {
  if (dx === 0 && dy === 0) return current;
  return directionFromAngle(Math.atan2(dy, dx));
}

export function directionAngle(direction) {
  const index = DIRECTIONS.indexOf(direction);
  return index < 0 ? Math.PI / 2 : index * (Math.PI / 4) - Math.PI / 2;
}

export class SpriteAnimator {
  #atlas;
  #animation = "idle";
  #frame = 0;
  #elapsed = 0;
  #done = false;
  direction = "S";
  rotation = 0;
  speed = 1;

  constructor(atlas) { this.#atlas = atlas; }
  get animation() { return this.#animation; }
  get frameIndex() { return this.#frame; }
  get isDone() { return this.#done; }
  get frameRect() { return this.#atlas.animations[this.#animation].frames[this.direction][this.#frame]; }

  play(name, { restart = false } = {}) {
    if (!ANIMATIONS.includes(name)) throw new TypeError(`Animação desconhecida: ${name}.`);
    if (name === this.#animation && !restart && !this.#done) return;
    this.#animation = name;
    this.#frame = 0;
    this.#elapsed = 0;
    this.#done = false;
  }

  request(name) {
    if (!ANIMATIONS.includes(name)) return false;
    const current = this.#atlas.animations[this.#animation];
    if (name === this.#animation) {
      if (!this.#done) return current.loop;
      if (current.hold) return false;
      this.play(name, { restart: true });
      return true;
    }
    const next = this.#atlas.animations[name];
    const allowed = current.loop || (this.#done && !current.hold) || next.priority > current.priority;
    if (allowed) this.play(name, { restart: true });
    return allowed;
  }

  update(deltaTime) {
    if (this.#done || !(deltaTime > 0)) return;
    const definition = this.#atlas.animations[this.#animation];
    this.#elapsed += deltaTime * 1000 * this.speed;
    for (let guard = 0; guard < 1000; guard += 1) {
      const duration = definition.durations[this.#frame];
      if (this.#elapsed < duration) return;
      this.#elapsed -= duration;
      if (this.#frame + 1 < definition.durations.length) this.#frame += 1;
      else if (definition.loop) this.#frame = 0;
      else {
        this.#done = true;
        this.#elapsed = 0;
        return;
      }
    }
  }
}

export function drawSoldierFrame(ctx, assets, animator, x, y, scale = 1.5) {
  if (!ctx || !assets?.image || !assets?.atlas || !animator) return;
  const { atlas, image } = assets;
  const frame = animator.frameRect;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(animator.rotation);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h,
    -atlas.pivot.x * scale, -atlas.pivot.y * scale,
    frame.w * scale, frame.h * scale);
  ctx.restore();
}