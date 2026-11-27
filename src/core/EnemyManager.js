import { Enemy } from "./Enemy.js";

const WAVE_DURATION = 45;
const MAX_WAVES = 100;
const FIRST_WAVE_TYPES = ["brute"];
const SPAWN_GRID_COLUMNS = 5;
const SPAWN_GRID_ROWS = 4;
const SPAWN_JITTER = 75;
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
  #announcementTimer = 0;
  #kills = 0;

  constructor(assets) {
    this.#assets = assets;
  }

  spawn(type, x, y) {
    if (!this.#assets?.[type]) return null;
    const enemy = new Enemy(type, x, y, this.#assets, this.#wave);
    this.#enemies.push(enemy);
    return enemy;
  }

  // A primeira leva também é controlada pelo relógio de waves.
  spawnInitialWave() {
    this.#spawnTimer = 0;
    this.#announcementTimer = 3;
  }

  update(player, deltaTime, world, elapsedTime = this.#elapsed + deltaTime) {
    this.#elapsed = Math.max(0, elapsedTime);
    const previousWave = this.#wave;
    this.#wave = Math.min(MAX_WAVES, Math.floor(this.#elapsed / WAVE_DURATION) + 1);

    if (this.#wave !== previousWave) {
      this.#spawnTimer = 0;
      this.#announcementTimer = 3;
    }
    this.#announcementTimer = Math.max(0, this.#announcementTimer - deltaTime);

    if (this.#wave <= MAX_WAVES && this.#elapsed < MAX_WAVES * WAVE_DURATION) {
      this.#spawnTimer -= deltaTime;
      if (this.#spawnTimer <= 0) {
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
    // Reduz linearmente de 2 s na wave 1 para 0,1 s na wave 100.
    const progress = (wave - 1) / (MAX_WAVES - 1);
    return 2 - progress * 1.9;
  }

  #getGroupSize(wave) {
    // Cresce linearmente de 1 inimigo na wave 1 para 100 na wave 100.
    const progress = (wave - 1) / (MAX_WAVES - 1);
    return 1 + Math.floor(progress * 99);
  }

  #spawnGroup(player, world) {
    const availableTypes = this.#getAvailableTypes(this.#wave);
    const groupSize = this.#getGroupSize(this.#wave);

    for (let i = 0; i < groupSize; i += 1) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      this.#spawnAtMapPoint(player, world, type);
    }
  }

  #spawnAtMapPoint(player, world, type) {
    const pointIndex = Math.floor(Math.random() * SPAWN_GRID_COLUMNS * SPAWN_GRID_ROWS);
    const column = pointIndex % SPAWN_GRID_COLUMNS;
    const row = Math.floor(pointIndex / SPAWN_GRID_COLUMNS);
    const cellWidth = world.width / SPAWN_GRID_COLUMNS;
    const cellHeight = world.height / SPAWN_GRID_ROWS;

    const anchorX = cellWidth * (column + 0.5);
    const anchorY = cellHeight * (row + 0.5);
    let x = Math.max(
      50,
      Math.min(world.width - 50, anchorX + (Math.random() * 2 - 1) * SPAWN_JITTER),
    );
    let y = Math.max(
      50,
      Math.min(world.height - 50, anchorY + (Math.random() * 2 - 1) * SPAWN_JITTER),
    );

    // Evita que um ponto de spawn apareça praticamente sobre o operador.
    if (Math.hypot(player.x - x, player.y - y) < 180) {
      x = world.width - x;
      y = world.height - y;
    }

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
  get waveTimeRemaining() {
    return WAVE_DURATION - (this.#elapsed % WAVE_DURATION);
  }
  get announcementRemaining() { return this.#announcementTimer; }
}
