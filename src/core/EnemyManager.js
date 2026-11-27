import { Enemy } from "./Enemy.js";

const MAX_ENEMIES = 70;
const WAVE_DURATION = 45;
const MAX_WAVES = 100;
const FIRST_WAVE_TYPES = ["brute"];
const WAVE_UNLOCKS = Object.freeze([
  { wave: 1, types: FIRST_WAVE_TYPES },
  { wave: 15, types: ["brute", "spitter"] },
  { wave: 35, types: ["brute", "spitter", "crawler"] },
  { wave: 50, types: ["brute", "spitter", "crawler", "bloater"] },
]);

export class EnemyManager {
  #assets;
  #enemies = [];
  #projectiles = [];
  #elapsed = 0;
  #wave = 1;
  #spawnTimer = 0;
  #kills = 0;

  constructor(assets) {
    this.#assets = assets;
  }

  spawn(type, x, y) {
    if (this.#enemies.length >= MAX_ENEMIES || !this.#assets?.[type]) return null;
    const enemy = new Enemy(type, x, y, this.#assets);
    this.#enemies.push(enemy);
    return enemy;
  }

  // A primeira leva também é controlada pelo relógio de waves.
  spawnInitialWave() {
    this.#spawnTimer = 0;
  }

  update(player, deltaTime, world, elapsedTime = this.#elapsed + deltaTime) {
    this.#elapsed = Math.max(0, elapsedTime);
    this.#wave = Math.min(MAX_WAVES, Math.floor(this.#elapsed / WAVE_DURATION) + 1);

    if (this.#wave <= MAX_WAVES && this.#elapsed < MAX_WAVES * WAVE_DURATION) {
      this.#spawnTimer -= deltaTime;
      if (this.#spawnTimer <= 0 && this.#enemies.length < MAX_ENEMIES) {
        this.#spawnGroup(player, world);
        this.#spawnTimer = this.#getSpawnInterval(this.#wave);
      }
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

  #getAvailableTypes(wave) {
    let available = FIRST_WAVE_TYPES;
    for (const unlock of WAVE_UNLOCKS) {
      if (wave >= unlock.wave) available = unlock.types;
    }
    return available;
  }

  #getSpawnInterval(wave) {
    // Começa em 8,5 s e acelera gradualmente até 1,5 s nas waves finais.
    return Math.max(1.5, 8.5 - (wave - 1) * 0.071);
  }

  #getGroupSize(wave) {
    // Aumenta um inimigo a cada 10 waves, chegando a grupos de 10.
    return Math.min(10, 1 + Math.floor((wave - 1) / 10));
  }

  #spawnGroup(player, world) {
    const availableTypes = this.#getAvailableTypes(this.#wave);
    const groupSize = this.#getGroupSize(this.#wave);
    const remainingSlots = MAX_ENEMIES - this.#enemies.length;
    const amount = Math.min(groupSize, remainingSlots);

    for (let i = 0; i < amount; i += 1) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      this.#spawnAroundPlayer(player, world, type, 300 + Math.random() * 100);
    }
  }

  #spawnAroundPlayer(player, world, type, distance) {
    const angle = Math.random() * Math.PI * 2;
    const x = Math.max(50, Math.min(world.width - 50, player.x + Math.cos(angle) * distance));
    const y = Math.max(50, Math.min(world.height - 50, player.y + Math.sin(angle) * distance));
    this.spawn(type, x, y);
  }

  #handleEnemyEvent(event, player) {
    const { enemy, name, targetX, targetY } = event;
    if (name === "hit_start") {
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
  get wave() { return this.#wave; }
}
