import { directionFromVector, drawSoldierFrame, SpriteAnimator } from "./SoldierSprite.js";

const SPEED = 250;
const RADIUS = 15;
const SPRITE_SCALE = 1.5;
const MAX_HEALTH = 100;
const DAMAGE_COOLDOWN = 0.55;

export class Player {
  x;
  y;
  #spriteAssets = null;
  #animator = null;
  #damageCooldown = 0;
  health = MAX_HEALTH;
  radius = RADIUS;
  damageFlash = 0;

  constructor(x, y, spriteAssets = null) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError("A posição inicial do jogador deve ser numérica.");
    this.x = x;
    this.y = y;
    this.setSpriteAssets(spriteAssets);
  }

  setSpriteAssets(assets) {
    this.#spriteAssets = assets;
    this.#animator = assets ? new SpriteAnimator(assets.atlas) : null;
  }

  playAnimation(name) {
    return this.#animator?.request(name) ?? false;
  }

  takeDamage(amount) {
    if (!Number.isFinite(amount) || amount <= 0 || this.#damageCooldown > 0 || this.health <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.#damageCooldown = DAMAGE_COOLDOWN;
    this.damageFlash = 0.18;
    return true;
  }

  update(input, deltaTime, world) {
    this.#damageCooldown = Math.max(0, this.#damageCooldown - deltaTime);
    this.damageFlash = Math.max(0, this.damageFlash - deltaTime);

    let dx = Number(input.isPressed("KeyD") || input.isPressed("ArrowRight"))
      - Number(input.isPressed("KeyA") || input.isPressed("ArrowLeft"));
    let dy = Number(input.isPressed("KeyS") || input.isPressed("ArrowDown"))
      - Number(input.isPressed("KeyW") || input.isPressed("ArrowUp"));

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      this.x = Math.max(RADIUS, Math.min(world.width - RADIUS, this.x + dx * SPEED * deltaTime));
      this.y = Math.max(RADIUS, Math.min(world.height - RADIUS, this.y + dy * SPEED * deltaTime));
      if (this.#animator) {
        this.#animator.direction = directionFromVector(dx, dy, this.#animator.direction);
        this.#animator.speed = 1.15;
        this.#animator.request("run");
      }
    } else {
      this.#animator?.request("idle");
    }
    this.#animator?.update(deltaTime);
  }

  render(ctx) {
    if (this.damageFlash > 0) ctx.globalAlpha = 0.55;
    if (this.#spriteAssets && this.#animator) {
      drawSoldierFrame(ctx, this.#spriteAssets, this.#animator, this.x, this.y, SPRITE_SCALE);
      ctx.globalAlpha = 1;
      return;
    }

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.fillRect(-10, 11, 20, 7);
    ctx.shadowColor = "rgba(72, 218, 255, 0.65)";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#42bfd8";
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(11, 7);
    ctx.lineTo(6, 13);
    ctx.lineTo(-6, 13);
    ctx.lineTo(-11, 7);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#d9fbff";
    ctx.fillRect(-3, -7, 6, 10);
    ctx.fillStyle = "#12364a";
    ctx.fillRect(-2, -5, 4, 6);
    ctx.fillStyle = "#f0b96e";
    ctx.fillRect(-2, 13, 4, 4);
    ctx.fillStyle = "#a5f4ff";
    ctx.fillRect(-15, 5, 5, 3);
    ctx.fillRect(10, 5, 5, 3);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export { MAX_HEALTH };
