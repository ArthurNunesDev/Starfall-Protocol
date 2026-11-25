const SPEED = 250;
const RADIUS = 15;

export class Player {
  x;
  y;

  constructor(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError("A posição inicial do jogador deve ser numérica.");
    }
    this.x = x;
    this.y = y;
  }

  update(input, deltaTime, world) {
    let dx = Number(input.isPressed("KeyD") || input.isPressed("ArrowRight"))
      - Number(input.isPressed("KeyA") || input.isPressed("ArrowLeft"));
    let dy = Number(input.isPressed("KeyS") || input.isPressed("ArrowDown"))
      - Number(input.isPressed("KeyW") || input.isPressed("ArrowUp"));
    if (dx === 0 && dy === 0) return;

    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;
    this.x = Math.max(RADIUS, Math.min(world.width - RADIUS, this.x + dx * SPEED * deltaTime));
    this.y = Math.max(RADIUS, Math.min(world.height - RADIUS, this.y + dy * SPEED * deltaTime));
  }

  render(ctx) {
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
