import { directionFromVector, drawSoldierFrame, SpriteAnimator } from "./SoldierSprite.js";

const SPEED = 250;
const RADIUS = 15;
const SPRITE_SCALE = 1.5;

export class Player {
  x;
  y;
  #spriteAssets = null;
  #animator = null;

  constructor(x, y, spriteAssets = null) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError("A posição inicial do jogador deve ser numérica.");
    }
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

  update(input, deltaTime, world) {
    let dx = Number(input.isPressed("KeyD") || input.isPressed("ArrowRight"))
      - Number(input.isPressed("KeyA") || input.isPressed("ArrowLeft"));
    let dy = Number(input.isPressed("KeyS") || input.isPressed("ArrowDown"))
      - Number(input.isPressed("KeyW") || input.isPressed("ArrowUp"));

    const isMoving = dx !== 0 || dy !== 0;
    if (isMoving) {
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
    if (this.#spriteAssets && this.#animator) {
      drawSoldierFrame(ctx, this.#spriteAssets, this.#animator, this.x, this.y, SPRITE_SCALE);
      return;
    }

    // Fallback visual caso o arquivo de sprites não esteja disponível.
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
  }
}