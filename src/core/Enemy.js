import { directionToTarget, drawEnemyFrame, EnemyAnimator } from "./EnemySprite.js";

const ENEMY_CONFIG = Object.freeze({
  brute: { name: "Brute", health: 100, speed: 76, radius: 22, scale: 1.5, damage: 13, range: 54, cooldown: 1.45 },
  crawler: { name: "Crawler", health: 55, speed: 126, radius: 15, scale: 1.5, damage: 8, range: 39, cooldown: 0.9 },
  spitter: { name: "Spitter", health: 65, speed: 62, radius: 17, scale: 1.5, damage: 10, range: 300, cooldown: 2.5 },
  bloater: { name: "Bloater", health: 135, speed: 48, radius: 25, scale: 1.5, damage: 32, range: 66, cooldown: 0 },
  boss: { name: "Boss", health: 1400, speed: 55, radius: 48, scale: 1.5, damage: 24, range: 104, cooldown: 1.7 },
});

export class Enemy {
  constructor(type, x, y, assets) {
    const config = ENEMY_CONFIG[type];
    if (!config || !assets?.[type]) throw new TypeError(`Tipo ou assets de inimigo inválido: ${type}.`);
    this.type = type;
    this.name = config.name;
    this.x = x;
    this.y = y;
    this.health = config.health;
    this.maxHealth = config.health;
    this.speed = config.speed;
    this.radius = config.radius;
    this.damage = config.damage;
    this.range = config.range;
    this.cooldown = config.cooldown;
    this.attackTimer = Math.random() * 0.4;
    this.scale = config.scale;
    this.animator = new EnemyAnimator(assets[type].atlas);
    this.assets = assets[type];
    this.dead = false;
    this.removed = false;
    this.exploding = false;
    this.attackLocked = false;
    this.phaseTwo = false;
    this.hitFlash = 0;
    this.lastDamage = 0;
    this.damageTextTimer = 0;
    this.damageTextOffset = 0;
  }

  update(target, deltaTime, world) {
    if (this.removed) return [];
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.damageTextTimer = Math.max(0, this.damageTextTimer - deltaTime);
    if (this.damageTextTimer > 0) this.damageTextOffset += deltaTime * 24;

    if (this.dead) {
      this.animator.update(deltaTime);
      if (this.animator.finished) this.removed = true;
      return [];
    }

    this.attackTimer = Math.max(0, this.attackTimer - deltaTime);
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const nx = dx / distance;
    const ny = dy / distance;
    this.animator.direction = directionToTarget(nx, ny);

    if (this.type === "bloater" && distance <= this.range && !this.exploding) {
      this.exploding = true;
      this.animator.play("explode", true);
    }

    if (this.type === "boss" && !this.phaseTwo && this.health <= this.maxHealth * 0.5) {
      this.phaseTwo = true;
      this.speed *= 1.25;
      this.animator.play("roar", true);
      this.attackLocked = true;
    }

    if (this.exploding) {
      const events = this.animator.update(deltaTime);
      if (events.includes("blast")) {
        this.dead = true;
        this.removed = true;
      }
      if (this.animator.finished) this.removed = true;
      return events.map((name) => ({ name, enemy: this, targetX: target.x, targetY: target.y }));
    }

    if (this.attackLocked) {
      const events = this.animator.update(deltaTime);
      if (this.animator.finished) this.attackLocked = false;
      return events.map((name) => ({ name, enemy: this, targetX: target.x, targetY: target.y }));
    }

    if (!this.animator.finished && ["melee", "spit", "slam", "roar"].includes(this.animator.name)) {
      const events = this.animator.update(deltaTime);
      if (this.animator.finished) this.attackLocked = false;
      return events.map((name) => ({ name, enemy: this, targetX: target.x, targetY: target.y }));
    }

    if (this.type === "boss") this.#updateBoss(distance, nx, ny, deltaTime, world);
    else if (this.type === "spitter") this.#updateSpitter(distance, nx, ny, deltaTime, world);
    else this.#updateChaser(distance, nx, ny, deltaTime, world);

    return this.animator.update(deltaTime)
      .map((name) => ({ name, enemy: this, targetX: target.x, targetY: target.y }));
  }

  #move(nx, ny, deltaTime, world, speed = this.speed) {
    this.x = Math.max(this.radius, Math.min(world.width - this.radius, this.x + nx * speed * deltaTime));
    this.y = Math.max(this.radius, Math.min(world.height - this.radius, this.y + ny * speed * deltaTime));
    this.animator.play("run");
  }

  #updateChaser(distance, nx, ny, deltaTime, world) {
    if (distance <= this.range) {
      if (this.attackTimer <= 0) {
        this.attackTimer = this.cooldown;
        this.animator.play("melee", true);
        this.attackLocked = true;
      } else {
        this.animator.play("idle");
      }
      return;
    }
    this.#move(nx, ny, deltaTime, world);
  }

  #updateSpitter(distance, nx, ny, deltaTime, world) {
    if (distance < 220) {
      this.#move(-nx, -ny, deltaTime, world, this.speed * 1.15);
    } else if (distance > 370) {
      this.#move(nx, ny, deltaTime, world);
    } else if (this.attackTimer <= 0) {
      this.attackTimer = this.cooldown;
      this.animator.play("spit", true);
      this.attackLocked = true;
    } else {
      this.animator.play("idle");
    }
  }

  #updateBoss(distance, nx, ny, deltaTime, world) {
    if (distance > 390) {
      this.#move(nx, ny, deltaTime, world);
      return;
    }
    if (this.attackTimer > 0) {
      if (distance > 170) this.#move(nx, ny, deltaTime, world, this.speed * 0.55);
      else this.animator.play("idle");
      return;
    }

    this.attackTimer = this.phaseTwo ? 1.15 : 1.7;
    if (distance <= 125) this.animator.play("melee", true);
    else if (distance <= 260) this.animator.play("slam", true);
    else this.animator.play("spit", true);
    this.attackLocked = true;
  }

  takeDamage(amount) {
    if (this.dead || this.exploding || !Number.isFinite(amount) || amount <= 0) return false;
    const previousHealth = this.health;
    this.health = Math.max(0, this.health - amount);
    this.lastDamage = Math.ceil(previousHealth - this.health);
    this.damageTextTimer = 0.75;
    this.damageTextOffset = 0;
    this.hitFlash = 0.12;
    if (this.health <= 0) {
      this.dead = true;
      this.animator.play("death", true);
    } else if (this.animator.name !== "hurt") {
      this.animator.play("hurt", true);
    }
    return true;
  }

  render(ctx) {
    if (this.removed) return;
    if (this.hitFlash > 0) ctx.globalAlpha = 0.65;
    drawEnemyFrame(ctx, this.assets, this.animator, this.x, this.y, this.scale);
    ctx.globalAlpha = 1;

    if (this.health < this.maxHealth && !this.dead) {
      const width = this.type === "boss" ? 92 : 48;
      const ratio = Math.max(0, Math.min(1, this.health / this.maxHealth));
      const barY = this.y - this.radius - 12;
      ctx.save();
      ctx.fillStyle = "rgba(3, 8, 16, 0.88)";
      ctx.fillRect(this.x - width / 2, barY, width, 5);
      ctx.fillStyle = this.type === "boss" ? "#f36b75" : "#f0ad61";
      ctx.fillRect(this.x - width / 2, barY, width * ratio, 5);
      ctx.strokeStyle = "rgba(235, 245, 255, 0.55)";
      ctx.lineWidth = 0.7;
      ctx.strokeRect(this.x - width / 2, barY, width, 5);
      ctx.font = this.type === "boss" ? "700 11px Rajdhani, sans-serif" : "600 9px Rajdhani, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#f3f7ff";
      ctx.shadowColor = "#050b16";
      ctx.shadowBlur = 4;
      ctx.fillText(`${Math.ceil(this.health)} / ${this.maxHealth}`, this.x, barY - 3);
      if (this.damageTextTimer > 0) {
        ctx.font = "700 13px Rajdhani, sans-serif";
        ctx.fillStyle = "#fff1a8";
        ctx.shadowColor = "#ff9b55";
        ctx.shadowBlur = 8;
        ctx.globalAlpha = Math.min(1, this.damageTextTimer / 0.2);
        ctx.fillText(`-${this.lastDamage}`, this.x, barY - 19 - this.damageTextOffset);
      }
      ctx.restore();
    }
  }
}

export { ENEMY_CONFIG };
