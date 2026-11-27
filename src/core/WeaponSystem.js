const WEAPON = Object.freeze({
  id: "pulse-rifle",
  name: "Fuzil de Pulso",
  description: "Arma automática de energia. Dispara contra o inimigo mais próximo.",
  damage: 42,
  fireInterval: 0.38,
  projectileSpeed: 680,
  projectileRange: 640,
  targetRange: 620,
  projectileRadius: 4,
});

export class WeaponSystem {
  #projectiles = [];
  #cooldown = 0;
  #onWeaponUnlocked;
  #onEnemyDefeated;
  #unlocked = false;

  constructor({ onWeaponUnlocked = null, onEnemyDefeated = null } = {}) {
    this.#onWeaponUnlocked = onWeaponUnlocked;
    this.#onEnemyDefeated = onEnemyDefeated;
  }

  update(player, enemyManager, deltaTime) {
    this.#cooldown = Math.max(0, this.#cooldown - deltaTime);
    const targets = enemyManager?.targets ?? [];
    let target = null;
    let nearestDistance = WEAPON.targetRange;

    for (const enemy of targets) {
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (enemy.exploding || distance >= nearestDistance) continue;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        target = enemy;
      }
    }

    if (target) {
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      player.setFacingAngle(angle, deltaTime);
      if (this.#cooldown <= 0) this.#fire(player, angle);
    }

    this.#updateProjectiles(targets, deltaTime);
  }

  #fire(player, angle) {
    this.#cooldown = WEAPON.fireInterval;
    const muzzleOffset = 25;
    this.#projectiles.push({
      x: player.x + Math.cos(angle) * muzzleOffset,
      y: player.y + Math.sin(angle) * muzzleOffset,
      vx: Math.cos(angle) * WEAPON.projectileSpeed,
      vy: Math.sin(angle) * WEAPON.projectileSpeed,
      damage: WEAPON.damage,
      radius: WEAPON.projectileRadius,
      remaining: WEAPON.projectileRange,
    });

    if (!this.#unlocked) {
      this.#unlocked = true;
      this.#onWeaponUnlocked?.({
        id: WEAPON.id,
        name: WEAPON.name,
        description: WEAPON.description,
      });
    }
  }

  #updateProjectiles(targets, deltaTime) {
    for (const projectile of this.#projectiles) {
      const distance = Math.hypot(projectile.vx, projectile.vy) * deltaTime;
      projectile.x += projectile.vx * deltaTime;
      projectile.y += projectile.vy * deltaTime;
      projectile.remaining -= distance;

      for (const enemy of targets) {
        if (enemy.dead || enemy.removed || enemy.exploding) continue;
        if (Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y)
          > enemy.radius + projectile.radius) continue;

        const wasAlive = !enemy.dead;
        enemy.takeDamage(projectile.damage);
        if (wasAlive && enemy.dead) {
          this.#onEnemyDefeated?.({
            id: enemy.type,
            name: enemy.name,
            description: `Ameaça neutralizada: ${enemy.name}.`,
          });
        }
        projectile.remaining = 0;
        break;
      }
    }

    this.#projectiles = this.#projectiles.filter((projectile) => projectile.remaining > 0);
  }

  render(ctx) {
    for (const projectile of this.#projectiles) {
      ctx.save();
      ctx.shadowColor = "#58eaff";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#a9f7ff";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  reset() {
    this.#projectiles = [];
    this.#cooldown = 0;
    this.#unlocked = false;
  }

  get weapon() { return WEAPON; }
}