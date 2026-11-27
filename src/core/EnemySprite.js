const ENEMY_TYPES = Object.freeze(["brute", "bloater", "crawler", "spitter", "boss"]);

export async function loadEnemyAssets() {
  const entries = await Promise.all(ENEMY_TYPES.map(async (type) => {
    const jsonUrl = new URL(`../../assets/sprites/enemies/${type}.json`, import.meta.url);
    const response = await fetch(jsonUrl);
    if (!response.ok) throw new Error(`Não foi possível carregar o atlas ${type}: HTTP ${response.status}.`);
    const atlas = await response.json();
    validateAtlas(atlas, type);

    const imageUrl = new URL(`../../assets/sprites/enemies/${atlas.image}`, import.meta.url);
    const image = new Image();
    image.src = imageUrl.href;
    await image.decode();

    const frames = Object.values(atlas.animations).flatMap((animation) =>
      Object.values(animation.frames).flat());
    const maxX = Math.max(...frames.map((frame) => frame.x + frame.w));
    const maxY = Math.max(...frames.map((frame) => frame.y + frame.h));
    if (image.naturalWidth < maxX || image.naturalHeight < maxY) {
      throw new Error(`Spritesheet ${type} menor que o atlas: ${image.naturalWidth}x${image.naturalHeight}.`);
    }
    return [type, Object.freeze({ atlas, image })];
  }));

  return Object.freeze(Object.fromEntries(entries));
}

function validateAtlas(atlas, type) {
  if (!atlas || !atlas.cell || !atlas.pivot || !Array.isArray(atlas.directions)
    || !atlas.animations?.idle || !atlas.animations?.run) {
    throw new Error(`Atlas inválido ou sem idle/run: ${type}.`);
  }

  for (const direction of atlas.directions) {
    for (const [name, animation] of Object.entries(atlas.animations)) {
      const frames = animation.frames?.[direction];
      if (!Array.isArray(frames) || !Array.isArray(animation.durations)
        || frames.length !== animation.durations.length
        || frames.some((frame) => ![frame.x, frame.y, frame.w, frame.h].every(Number.isFinite)
          || frame.x < 0 || frame.y < 0 || frame.w <= 0 || frame.h <= 0)
        || animation.durations.some((duration) => !Number.isFinite(duration) || duration <= 0)) {
        throw new Error(`Animação ${name} inválida na direção ${direction}: ${type}.`);
      }
    }
  }
}

export class EnemyAnimator {
  #atlas;
  #name = "idle";
  #frame = 0;
  #elapsed = 0;
  #done = false;
  direction = "S";

  constructor(atlas) { this.#atlas = atlas; }

  get name() { return this.#name; }
  get finished() { return this.#done; }
  get frameRect() { return this.#atlas.animations[this.#name].frames[this.direction][this.#frame]; }

  play(name, force = false) {
    const next = this.#atlas.animations[name];
    if (!next) return false;
    if (name === this.#name && !this.#done) return true;

    const current = this.#atlas.animations[this.#name];
    if (!force && !current.loop && !this.#done && next.priority <= current.priority) return false;
    this.#name = name;
    this.#frame = 0;
    this.#elapsed = 0;
    this.#done = false;
    return true;
  }

  update(deltaTime) {
    if (this.#done || !(deltaTime > 0)) return [];
    const animation = this.#atlas.animations[this.#name];
    this.#elapsed += deltaTime * 1000;
    const emitted = [];

    for (let guard = 0; guard < 100; guard += 1) {
      const duration = animation.durations[this.#frame];
      if (this.#elapsed < duration) break;
      this.#elapsed -= duration;

      if (this.#frame + 1 < animation.durations.length) this.#frame += 1;
      else if (animation.loop) this.#frame = 0;
      else {
        this.#done = true;
        this.#elapsed = 0;
        break;
      }

      const frameEvents = animation.events?.[String(this.#frame)];
      if (Array.isArray(frameEvents)) emitted.push(...frameEvents);
    }
    return emitted;
  }
}

export function drawEnemyFrame(ctx, assets, animator, x, y, scale = 1) {
  const frame = animator.frameRect;
  const { atlas, image } = assets;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h,
    Math.round(x - atlas.pivot.x * scale), Math.round(y - atlas.pivot.y * scale),
    frame.w * scale, frame.h * scale);
  ctx.restore();
}

export function directionToTarget(dx, dy) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  if (dx === 0 && dy === 0) return "S";
  const sector = (((Math.atan2(dy, dx) * 180 / Math.PI + 90) / 45) % 8 + 8) % 8;
  return directions[Math.round(sector) % 8];
}
