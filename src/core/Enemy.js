import { directionToTarget, drawEnemyFrame, EnemyAnimator } from "./EnemySprite.js";

const ENEMY_CONFIG = Object.freeze({
  brute: { name: "Brute", health: 80, speed: 72, radius: 22, scale: 1.5 },
  bloater: { name: "Bloater", health: 120, speed: 42, radius: 25, scale: 1.5 },
  crawler: { name: "Crawler", health: 45, speed: 112, radius: 15, scale: 1.5 },
  spitter: { name: "Spitter", health: 55, speed: 58, radius: 17, scale: 1.5 },
  boss: { name: "Boss", health: 1200, speed: 48, radius: 48, scale: 1.5 },
});

export class Enemy {
  constructor(type, x, y, assets) {
    const config = ENEMY_CONFIG[type];
    if (!config || !assets?.[type]) throw new TypeError(`Tipo ou assets de inimigo inválido: ${type}.`);
    this.type = type;
    this.x = x;
    this.y = y;
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.radius = config.radius;
    this.scale = config.scale;
    this.animator = new EnemyAnimator(assets[type].atlas);
    this.assets = assets[type];
  }

  update(target, deltaTime, world) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 1) {
      const nx = dx / distance;
      const ny = dy / distance;
      this.x = Math.max(this.radius, Math.min(world.width - this.radius, this.x + nx * this.speed * deltaTime));
      this.y = Math.max(this.radius, Math.min(world.height - this.radius, this.y + ny * this.speed * deltaTime));
      this.animator.direction = directionToTarget(nx, ny);
      this.animator.play("run");
    } else {
      this.animator.play("idle");
    }
    this.animator.update(deltaTime);
  }

  render(ctx) {
    drawEnemyFrame(ctx, this.assets, this.animator, this.x, this.y, this.scale);
  }
}

export { ENEMY_CONFIG };
