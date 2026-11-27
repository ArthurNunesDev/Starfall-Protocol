import { Enemy } from "./Enemy.js";

const MAX_ENEMIES = 22;
const WAVE_INTERVAL = 7.5;
const BOSS_TIME = 60;
const REGULAR_TYPES = ["brute", "crawler", "spitter", "bloater"];

export class EnemyManager {
  #assets;
  #enemies = [];
  #projectiles = [];
  #elapsed = 0;
  #nextWave = WAVE_INTERVAL;
  #bossSpawned = false;
  #kills = 0;

  constructor(assets) {
    this.#assets = assets;
  }

  spawn(type, x, y) {
    if ((this.#enemies.length >= MAX_ENEMIES && type !== "boss") || !this.#assets?.[type]) return null;
    const enemy = new Enemy(type, x, y, this.#assets);
    this.#enemies.push(enemy);
    return enemy;
  }

  spawnInitialWave(player, world) {
    if (this.#enemies.length > 0) return;
    this.spawn("brute", Math.min(world.width - 80, player.x + 280), Math.min(world.height - 80, player.y + 80));
    this.spawn("crawler", Math.max(80, player.x - 320), Math.min(world.height - 80, player.y + 170));
    this.spawn("spitter", Math.min(world.width - 80, player.x + 360), Math.max(80, player.y - 220));
    this.spawn("bloater", Math.max(80, player.x - 360), Math.max(80, player.y - 180));
  }

  update(player, deltaTime, world, elapsedTime = this.#elapsed + deltaTime) {
    this.#elapsed = elapsedTime;
    if (this.#elapsed >= this.#nextWave && this.#enemies.length < MAX_ENEMIES) {
      const type = REGULAR_TYPES[Math.floor(Math.random() * REGULAR_TYPES.length)];
      this.#spawnAroundPlayer(player, world, type);
      const interval = Math.max(3.5, WAVE_INTERVAL - Math.min(3, this.#elapsed / 45));
      do {
        this.#nextWave += interval;
      } while (this.#nextWave <= this.#elapsed);
    }

    if (!this.#bossSpawned && this.#elapsed >= BOSS_TIME) {
      this.#bossSpawned = true;
      this.#spawnAroundPlayer(player, world, "boss", 520);
    }

    for (const enemy of this.#enemies) {
      for (const event of enemy.update(player, deltaTime, world)) {
        this.#handleEnemyEvent(event, player);
      }
    }

    this.#updateProjectiles(player, deltaTime);
    this.#enemies = this.#enemies.filter((enemy) => {
      if (!enemy.removed) return true;
      if (enemy.dead && !enemy.killCounted) {
        enemy.killCounted = true;
        this.#kills += 1;
      }
      return false;
    });
  }

  #spawnAroundPlayer(player, world, type, minDistance = 340) {
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * 100;
    const x = Math.max(50, Math.min(world.width - 50, player.x + Math.cos(angle) * distance));
    const y = Math.max(50, Math.min(world.height - 50, player.y + Math.sin(angle) * distance));
    this.spawn(type, x, y);
  }

  #handleEnemyEvent(event, player) {
    const { enemy, name, targetX, targetY } = event;
    if (name === "hit_start") {
      if (enemy.type === "boss" && enemy.animator.name === "slam") return;
      const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (distance <= enemy.range + player.radius) player.takeDamage(enemy.damage);
    } else if (name === "spit" || name === "volley") {
      const count = name === "volley" ? 3 : 1;
      const baseAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);
      for (let i = 0; i < count; i += 1) {
        const spread = count === 1 ? 0 : (i - 1) * 0.16;
        this.#projectiles.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(baseAngle + spread) * (name === "volley" ? 270 : 230),
          vy: Math.sin(baseAngle + spread) * (name === "volley" ? 270 : 230),
          damage: name === "volley" ? 13 : enemy.damage,
          radius: name === "volley" ? 8 : 6,
          life: 3.2,
        });
      }
    } else if (name === "blast") {
      const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (distance <= 145 + player.radius) player.takeDamage(enemy.damage);
    } else if (name === "impact" && enemy.type === "boss" && enemy.animator.name === "slam") {
      const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (distance <= 190 + player.radius) player.takeDamage(enemy.damage * 1.5);
    }
  }

  #updateProjectiles(player, deltaTime) {
    for (const projectile of this.#projectiles) {
      projectile.x += projectile.vx * deltaTime;
      projectile.y += projectile.vy * deltaTime;
      projectile.life -= deltaTime;
      if (projectile.life > 0
        && Math.hypot(player.x - projectile.x, player.y - projectile.y) <= projectile.radius + player.radius) {
        player.takeDamage(projectile.damage);
        projectile.life = 0;
      }
    }
    this.#projectiles = this.#projectiles.filter((projectile) => projectile.life > 0);
  }

  render(ctx) {
    for (const projectile of this.#projectiles) {
      ctx.save();
      ctx.shadowColor = "#ff7c82";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#ff9a84";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const enemy of this.#enemies) enemy.render(ctx);
  }

  get targets() { return this.#enemies.filter((enemy) => !enemy.dead && !enemy.removed); }
  get count() { return this.#enemies.length; }
  get kills() { return this.#kills; }
  get elapsed() { return this.#elapsed; }
}
