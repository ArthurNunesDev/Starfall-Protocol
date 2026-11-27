import { directionAngle, directionFromAngle, drawSoldierFrame, SpriteAnimator } from "./SoldierSprite.js";

const SPEED = 250;
const RADIUS = 15;
const SPRITE_SCALE = 1.5;
const MAX_HEALTH = 10;
const DAMAGE_COOLDOWN = 0.55;
const TURN_RESPONSE = 16;
const SIXTEEN_WAY_STEP = Math.PI / 8;

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export class Player {
  x;
  y;
  #spriteAssets = null;
  #animator = null;
  #damageCooldown = 0;
  #facingAngle = Math.PI / 2;
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
    this.#syncSpriteDirection();
  }

  setFacingAngle(angle, deltaTime) {
    if (!Number.isFinite(angle)) return;
    const targetAngle = Math.round(angle / SIXTEEN_WAY_STEP) * SIXTEEN_WAY_STEP;
    const difference = normalizeAngle(targetAngle - this.#facingAngle);
    const response = 1 - Math.exp(-TURN_RESPONSE * Math.max(0, deltaTime));
    this.#facingAngle = normalizeAngle(this.#facingAngle + difference * response);
    this.#syncSpriteDirection();
  }

  #syncSpriteDirection() {
    if (!this.#animator) return;
    this.#animator.direction = directionFromAngle(this.#facingAngle);
    this.#animator.rotation = normalizeAngle(this.#facingAngle - directionAngle(this.#animator.direction));
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
      this.setFacingAngle(Math.atan2(dy, dx), deltaTime);
      if (this.#animator) {
        this.#animator.speed = 1.15;
        this.#animator.request("run");
      }
    } else {
      this.#animator?.request("idle");
    }
    this.#animator?.update(deltaTime);
  }

  render(ctx) {
    ctx.save();
    if (this.damageFlash > 0) ctx.globalAlpha = 0.55;
    if (this.#spriteAssets && this.#animator) {
      drawSoldierFrame(ctx, this.#spriteAssets, this.#animator, this.x, this.y, SPRITE_SCALE);
    } else {
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
      ctx.restore();
    }

    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.rotate(this.#facingAngle);
    ctx.shadowColor = "rgba(68, 220, 255, 0.7)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#263f55";
    ctx.fillRect(1, -5, 22, 10);
    ctx.fillStyle = "#8deeff";
    ctx.fillRect(10, -3, 15, 6);
    ctx.fillStyle = "#d7faff";
    ctx.fillRect(22, -2, 7, 4);
    ctx.fillStyle = "#172b3e";
    ctx.fillRect(5, 4, 7, 5);
    ctx.restore();

    const healthRatio = Math.max(0, Math.min(1, this.health / MAX_HEALTH));
    const healthBarWidth = 42;
    const healthBarY = this.y + 31;
    ctx.save();
    ctx.fillStyle = "rgba(3, 8, 16, 0.88)";
    ctx.fillRect(this.x - healthBarWidth / 2, healthBarY, healthBarWidth, 5);
    ctx.fillStyle = healthRatio > 0.35 ? "#65e4c1" : "#f16e79";
    ctx.fillRect(this.x - healthBarWidth / 2, healthBarY, healthBarWidth * healthRatio, 5);
    ctx.strokeStyle = "rgba(190, 230, 245, 0.55)";
    ctx.lineWidth = 0.7;
    ctx.strokeRect(this.x - healthBarWidth / 2, healthBarY, healthBarWidth, 5);
    ctx.font = "600 9px Rajdhani, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8f4ff";
    ctx.shadowColor = "#050b16";
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.ceil(this.health)} / ${MAX_HEALTH}`, this.x, healthBarY + 15);
    ctx.restore();
  }
}

export { MAX_HEALTH };