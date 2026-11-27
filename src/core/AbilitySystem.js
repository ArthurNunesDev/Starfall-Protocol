const MAX_RIFT_CHARGES = 2;
const RIFT_RECHARGE = 5;
const RIFT_DISTANCE = 250;
const PULSE_RADIUS = 160;
const PULSE_DAMAGE = 5;
const PULSE_PUSH = 120;
const OVERLOAD_DURATION = 8;
const OVERLOAD_COOLDOWN = 20;
const DRONE_DURATION = 10;
const DRONE_COOLDOWN = 12;
const DRONE_MAX = 3;
const DRONE_DAMAGE = 3;
const DRONE_INTERVAL = 1;
const ULTIMATE_MAX_CHARGE = 10;
const ULTIMATE_COOLDOWN = 50;
const ULTIMATE_BUFF_DURATION = 30;
const NUCLEUS_CHANCE = 0.1;
const NUCLEUS_RADIUS = 80;
const NUCLEUS_DAMAGE = 3;
const EMERGENCY_HEALTH_THRESHOLD = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceToSegment(pointX, pointY, startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= 0.0001) return Math.hypot(pointX - startX, pointY - startY);
  const projection = clamp(((pointX - startX) * dx + (pointY - startY) * dy) / lengthSquared, 0, 1);
  return Math.hypot(pointX - (startX + projection * dx), pointY - (startY + projection * dy));
}

export class AbilitySystem {
  #onEnemyDefeated;
  #cooldowns = { pulse: 0, overload: 0, drone: 0, ultimate: 0 };
  #riftCharges = MAX_RIFT_CHARGES;
  #riftRechargeTimer = 0;
  #overloadTimer = 0;
  #ultimateBuffTimer = 0;
  #ultimateCharging = false;
  #ultimateCharge = 0;
  #lastWave = 0;
  #lastResourceWave = 0;
  #drones = [];
  #effects = [];
  #reportedDefeats = new WeakSet();
  #nucleusProcessed = new WeakSet();

  constructor({ onEnemyDefeated = null } = {}) {
    this.#onEnemyDefeated = onEnemyDefeated;
  }

  update(input, player, enemyManager, deltaTime, world, mouseWorldPosition = null) {
    const dt = Math.max(0, Math.min(deltaTime, 0.1));
    const wave = enemyManager?.wave ?? 1;

    for (const key of Object.keys(this.#cooldowns)) {
      this.#cooldowns[key] = Math.max(0, this.#cooldowns[key] - dt);
    }
    this.#overloadTimer = Math.max(0, this.#overloadTimer - dt);
    this.#ultimateBuffTimer = Math.max(0, this.#ultimateBuffTimer - dt);
    this.#updateRiftRecharge(dt);
    this.#updateEffects(dt);

    if (wave !== this.#lastWave) {
      const wavesToGrant = this.#lastWave === 0 ? wave : Math.max(0, wave - this.#lastWave);
      this.#lastWave = wave;
      if (wavesToGrant > 0) player.addShield(25 * wavesToGrant);
    }

    if (player.health > 0 && player.health < EMERGENCY_HEALTH_THRESHOLD
      && this.#lastResourceWave !== wave) {
      player.addEmergencyShield(50, 5);
      this.#lastResourceWave = wave;
    }

    if (input.consumePressed("KeyQ")) this.#activateRift(player, world, mouseWorldPosition);
    if (input.consumePressed("KeyZ")) this.#activatePulse(player, enemyManager, world);
    if (input.consumePressed("KeyX")) this.#activateOverload();
    if (input.consumePressed("KeyC")) this.#activateDrone();

    if (input.consumePressed("KeyV") && this.#cooldowns.ultimate <= 0) {
      this.#ultimateCharging = true;
      this.#ultimateCharge = 0;
    }

    if (this.#ultimateCharging && input.isPressed("KeyV")) {
      this.#ultimateCharge = Math.min(ULTIMATE_MAX_CHARGE, this.#ultimateCharge + dt);
      if (this.#ultimateCharge >= ULTIMATE_MAX_CHARGE) {
        this.#fireUltimate(player, enemyManager, mouseWorldPosition);
      }
    }

    if (this.#ultimateCharging && input.consumeReleased("KeyV")) {
      this.#fireUltimate(player, enemyManager, mouseWorldPosition);
    }

    this.#updateDrones(player, enemyManager, dt);
    this.#updateRiftTrails(enemyManager, dt);
  }

  #updateRiftRecharge(deltaTime) {
    if (this.#riftCharges >= MAX_RIFT_CHARGES) {
      this.#riftRechargeTimer = 0;
      return;
    }
    this.#riftRechargeTimer += deltaTime;
    while (this.#riftRechargeTimer >= RIFT_RECHARGE && this.#riftCharges < MAX_RIFT_CHARGES) {
      this.#riftRechargeTimer -= RIFT_RECHARGE;
      this.#riftCharges += 1;
    }
  }

  #activateRift(player, world, mouseWorldPosition) {
    if (this.#riftCharges <= 0) return;
    const targetX = mouseWorldPosition?.x ?? player.x + Math.cos(player.facingAngle) * RIFT_DISTANCE;
    const targetY = mouseWorldPosition?.y ?? player.y + Math.sin(player.facingAngle) * RIFT_DISTANCE;
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 0.001) return;

    const travel = Math.min(RIFT_DISTANCE, distance);
    const startX = player.x;
    const startY = player.y;
    const endX = clamp(startX + (dx / distance) * travel, player.radius, world.width - player.radius);
    const endY = clamp(startY + (dy / distance) * travel, player.radius, world.height - player.radius);

    player.x = endX;
    player.y = endY;
    const empowered = this.#ultimateBuffTimer > 0;
    this.#effects.push({
      type: "trail",
      startX,
      startY,
      endX,
      endY,
      age: 0,
      duration: 2,
      empowered,
    });
    this.#riftCharges -= 1;
    if (this.#riftCharges < MAX_RIFT_CHARGES && this.#riftRechargeTimer <= 0) {
      this.#riftRechargeTimer = 0;
    }
  }

  #activatePulse(player, enemyManager, world) {
    if (this.#cooldowns.pulse > 0) return;
    this.#cooldowns.pulse = 8;
    const empowered = this.#ultimateBuffTimer > 0;
    const damageMultiplier = empowered ? 1.25 : 1;
    this.#effects.push({
      type: "pulse",
      x: player.x,
      y: player.y,
      age: 0,
      duration: 0.42,
      radius: PULSE_RADIUS,
      color: empowered ? "#ff3158" : "#65eaff",
      empowered,
    });

    for (const enemy of enemyManager?.targets ?? []) {
      if (enemy.exploding) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > PULSE_RADIUS + enemy.radius) continue;
      this.#damageEnemy(enemy, PULSE_DAMAGE * damageMultiplier, enemyManager);
      const angle = distance > 0.001 ? Math.atan2(dy, dx) : 0;
      enemy.x = clamp(enemy.x + Math.cos(angle) * PULSE_PUSH, enemy.radius, world.width - enemy.radius);
      enemy.y = clamp(enemy.y + Math.sin(angle) * PULSE_PUSH, enemy.radius, world.height - enemy.radius);
    }
  }

  #activateOverload() {
    if (this.#cooldowns.overload > 0) return;
    this.#cooldowns.overload = OVERLOAD_COOLDOWN;
    this.#overloadTimer = OVERLOAD_DURATION;
  }

  #activateDrone() {
    if (this.#cooldowns.drone > 0 || this.#drones.length >= DRONE_MAX) return;
    this.#cooldowns.drone = DRONE_COOLDOWN;
    const baseCount = this.#drones.length;
    const availableSlots = DRONE_MAX - baseCount;
    for (let index = 0; index < availableSlots; index += 1) {
      this.#drones.push({
        angle: ((baseCount + index) / DRONE_MAX) * Math.PI * 2,
        age: 0,
        shotTimer: DRONE_INTERVAL,
        x: 0,
        y: 0,
      });
    }
  }

  #updateDrones(player, enemyManager, deltaTime) {
    const targets = enemyManager?.targets ?? [];
    for (const drone of this.#drones) {
      drone.age += deltaTime;
      drone.angle += deltaTime * 1.8;
      drone.x = player.x + Math.cos(drone.angle) * 48;
      drone.y = player.y + Math.sin(drone.angle) * 30 - 24;
      drone.shotTimer -= deltaTime;

      if (drone.shotTimer <= 0) {
        drone.shotTimer += DRONE_INTERVAL;
        let target = null;
        let nearest = Infinity;
        for (const enemy of targets) {
          if (enemy.dead || enemy.removed || enemy.exploding) continue;
          const distance = Math.hypot(enemy.x - drone.x, enemy.y - drone.y);
          if (distance < nearest) {
            nearest = distance;
            target = enemy;
          }
        }
        if (target) {
          const empowered = this.#ultimateBuffTimer > 0;
          this.#effects.push({
            type: "drone-shot",
            x1: drone.x,
            y1: drone.y,
            x2: target.x,
            y2: target.y,
            age: 0,
            duration: 0.12,
            empowered,
          });
          this.#damageEnemy(target, DRONE_DAMAGE * (empowered ? 1.25 : 1), enemyManager);
        }
      }
    }
    this.#drones = this.#drones.filter((drone) => drone.age < DRONE_DURATION);
  }

  #fireUltimate(player, enemyManager, mouseWorldPosition) {
    if (!this.#ultimateCharging) return;
    const charge = this.#ultimateCharge;
    const damage = 20 + 10 * charge;
    const targets = (enemyManager?.targets ?? []).filter((enemy) => !enemy.exploding);
    let target = null;

    if (mouseWorldPosition) {
      let hoveredDistance = Infinity;
      for (const enemy of targets) {
        const cursorDistance = Math.hypot(enemy.x - mouseWorldPosition.x, enemy.y - mouseWorldPosition.y);
        if (cursorDistance <= Math.max(enemy.radius, 20) && cursorDistance < hoveredDistance) {
          hoveredDistance = cursorDistance;
          target = enemy;
        }
      }
    }

    if (!target) {
      for (const enemy of targets) {
        if (!target || enemy.health > target.health) target = enemy;
      }
    }

    if (target) {
      this.#effects.push({
        type: "laser",
        x1: player.x,
        y1: player.y,
        x2: target.x,
        y2: target.y,
        age: 0,
        duration: 0.32,
        red: charge > 5,
      });
      this.#damageEnemy(target, damage, enemyManager);
    }

    if (charge > 5) this.#ultimateBuffTimer = ULTIMATE_BUFF_DURATION;
    this.#cooldowns.ultimate = ULTIMATE_COOLDOWN;
    this.#ultimateCharging = false;
    this.#ultimateCharge = 0;
  }

  #updateRiftTrails(enemyManager, deltaTime) {
    const targets = enemyManager?.targets ?? [];
    for (const effect of this.#effects) {
      if (effect.type !== "trail") continue;
      for (const enemy of targets) {
        if (enemy.exploding || enemy.dead) continue;
        if (distanceToSegment(enemy.x, enemy.y, effect.startX, effect.startY, effect.endX, effect.endY)
          <= enemy.radius + 10) {
          this.#damageEnemy(enemy, 2 * deltaTime * (effect.empowered ? 1.25 : 1), enemyManager);
        }
      }
    }
  }

  #damageEnemy(enemy, amount, enemyManager, defeatedQueue = null) {
    if (!enemy || enemy.dead || enemy.removed || enemy.exploding) return false;
    const wasAlive = !enemy.dead;
    const applied = enemy.takeDamage(amount);
    if (applied && wasAlive && enemy.dead) {
      if (defeatedQueue) defeatedQueue.push(enemy);
      else this.onEnemyDefeated(enemy, enemyManager);
    }
    return applied;
  }

  onEnemyDefeated(enemy, enemyManager) {
    if (!enemy || this.#reportedDefeats.has(enemy)) return;
    const queue = [enemy];
    const targets = enemyManager?.targets ?? [];
    for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
      const defeated = queue[queueIndex];
      if (!defeated || this.#reportedDefeats.has(defeated)) continue;
      this.#reportedDefeats.add(defeated);
      this.#onEnemyDefeated?.({
        id: defeated.type,
        name: defeated.name,
        description: "Ameaça neutralizada: " + defeated.name + ".",
      });

      if (this.#nucleusProcessed.has(defeated)) continue;
      this.#nucleusProcessed.add(defeated);
      if (Math.random() >= NUCLEUS_CHANCE) continue;

      this.#effects.push({
        type: "pulse",
        x: defeated.x,
        y: defeated.y,
        age: 0,
        duration: 0.35,
        radius: NUCLEUS_RADIUS,
        color: "#ffbd65",
      });

      for (const nearby of targets) {
        if (nearby === defeated || nearby.dead || nearby.exploding) continue;
        if (Math.hypot(nearby.x - defeated.x, nearby.y - defeated.y) > NUCLEUS_RADIUS + nearby.radius) continue;
        this.#damageEnemy(nearby, NUCLEUS_DAMAGE, enemyManager, queue);
      }
    }
  }

  #updateEffects(deltaTime) {
    for (const effect of this.#effects) effect.age += deltaTime;
    this.#effects = this.#effects.filter((effect) => effect.age < effect.duration);
  }

  get weaponVisualState() {
    return {
      ultimateRed: (this.#ultimateCharging && this.#ultimateCharge > 5)
        || this.#ultimateBuffTimer > 0,
    };
  }

  get weaponModifiers() {
    return {
      damage: this.#ultimateBuffTimer > 0 ? 1.25 : 1,
      fireRate: (this.#overloadTimer > 0 ? 2 : 1) * (this.#ultimateBuffTimer > 0 ? 1.25 : 1),
      paused: this.#ultimateCharging,
    };
  }

  get hudState() {
    return {
      riftCharges: this.#riftCharges,
      riftMaxCharges: MAX_RIFT_CHARGES,
      riftRecharge: this.#riftCharges < MAX_RIFT_CHARGES ? Math.max(0, RIFT_RECHARGE - this.#riftRechargeTimer) : 0,
      pulseCooldown: this.#cooldowns.pulse,
      overloadCooldown: this.#cooldowns.overload,
      overloadRemaining: this.#overloadTimer,
      droneCooldown: this.#cooldowns.drone,
      droneCount: this.#drones.length,
      ultimateCooldown: this.#cooldowns.ultimate,
      ultimateCharging: this.#ultimateCharging,
      ultimateCharge: this.#ultimateCharge,
      ultimateBuffRemaining: this.#ultimateBuffTimer,
    };
  }

  render(ctx) {
    for (const effect of this.#effects) {
      const progress = effect.age / effect.duration;
      const empoweredColor = effect.empowered ? "#ff3158" : "#55eaff";
      if (effect.type === "trail") {
        ctx.save();
        const alpha = Math.max(0, 1 - progress);
        const dx = effect.endX - effect.startX;
        const dy = effect.endY - effect.startY;
        const angle = Math.atan2(dy, dx);
        ctx.globalAlpha = alpha;
        ctx.lineCap = "round";
        ctx.shadowBlur = 24;
        ctx.shadowColor = empoweredColor;
        ctx.strokeStyle = effect.empowered ? "rgba(255, 49, 88, 0.24)" : "rgba(87, 231, 255, 0.22)";
        ctx.lineWidth = 30 * (1 - progress * 0.45);
        ctx.beginPath();
        ctx.moveTo(effect.startX, effect.startY);
        ctx.lineTo(effect.endX, effect.endY);
        ctx.stroke();
        ctx.shadowBlur = 14;
        ctx.strokeStyle = effect.empowered ? "#ff3158" : "#6af1ff";
        ctx.lineWidth = 9 * (1 - progress * 0.35);
        ctx.beginPath();
        ctx.moveTo(effect.startX, effect.startY);
        ctx.lineTo(effect.endX, effect.endY);
        ctx.stroke();
        ctx.setLineDash([7, 12]);
        ctx.lineDashOffset = -effect.age * 70;
        ctx.strokeStyle = effect.empowered ? "#ffe1e7" : "#d8fbff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(effect.startX, effect.startY);
        ctx.lineTo(effect.endX, effect.endY);
        ctx.stroke();
        ctx.setLineDash([]);
        for (const [x, y, direction] of [
          [effect.startX, effect.startY, angle],
          [effect.endX, effect.endY, angle + Math.PI],
        ]) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(direction);
          ctx.strokeStyle = effect.empowered ? "#ffd1da" : "#b9f8ff";
          ctx.shadowColor = effect.empowered ? "#ff1744" : "#4be7ff";
          ctx.shadowBlur = 18;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, 0, 15 * (1 + progress * 0.3), 25 * (1 - progress * 0.25), 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      } else if (effect.type === "pulse") {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.strokeStyle = effect.color;
        ctx.shadowColor = effect.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius * progress, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (effect.type === "laser" || effect.type === "drone-shot") {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - progress);
        const isRedLaser = effect.type === "laser" && effect.red;
        const isEmpoweredShot = effect.type === "drone-shot" && effect.empowered;
        ctx.strokeStyle = isRedLaser || isEmpoweredShot ? "#ff1744" : effect.type === "laser" ? "#8af5ff" : "#5deaff";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = effect.type === "laser" ? (isRedLaser ? 42 : 28) : isEmpoweredShot ? 24 : 12;
        ctx.lineCap = "round";
        ctx.lineWidth = effect.type === "laser" ? (isRedLaser ? 18 : 12) * (1 - progress) + 3 : isEmpoweredShot ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(effect.x1, effect.y1);
        ctx.lineTo(effect.x2, effect.y2);
        ctx.stroke();
        if (isRedLaser) {
          ctx.shadowBlur = 8;
          ctx.strokeStyle = "#fff0f3";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(effect.x1, effect.y1);
          ctx.lineTo(effect.x2, effect.y2);
          ctx.stroke();
          ctx.fillStyle = "#ff3158";
          ctx.shadowColor = "#ff1744";
          ctx.shadowBlur = 26;
          ctx.beginPath();
          ctx.arc(effect.x2, effect.y2, 13 * (1 - progress) + 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    const dronesEmpowered = this.#ultimateBuffTimer > 0;
    for (const drone of this.#drones) {
      const mainColor = dronesEmpowered ? "#ff3158" : "#63eaff";
      const coreColor = dronesEmpowered ? "#fff0f3" : "#e5fcff";
      const darkColor = dronesEmpowered ? "#761c32" : "#15516a";
      const pulse = 1 + Math.sin(drone.age * 7) * 0.08;

      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.angle * 0.35);
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = dronesEmpowered ? 25 : 18;

      // Propulsores laterais.
      ctx.fillStyle = darkColor;
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 1.5;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.rotate(side * 0.18);
        ctx.beginPath();
        ctx.moveTo(-3, side * 3);
        ctx.lineTo(-13, side * 10);
        ctx.lineTo(-9, side * 14);
        ctx.lineTo(1, side * 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = mainColor;
        ctx.globalAlpha = 0.65 + Math.sin(drone.age * 12 + side) * 0.2;
        ctx.beginPath();
        ctx.ellipse(-10, side * 11, 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.9;
      }

      // Carcaça central e núcleo luminoso.
      ctx.fillStyle = darkColor;
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(5, -7);
      ctx.lineTo(-7, -6);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-7, 6);
      ctx.lineTo(5, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = coreColor;
      ctx.shadowBlur = dronesEmpowered ? 22 : 14;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = mainColor;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  cancelCharge() {
    this.#ultimateCharging = false;
    this.#ultimateCharge = 0;
  }

  reset() {
    this.#cooldowns = { pulse: 0, overload: 0, drone: 0, ultimate: 0 };
    this.#riftCharges = MAX_RIFT_CHARGES;
    this.#riftRechargeTimer = 0;
    this.#overloadTimer = 0;
    this.#ultimateBuffTimer = 0;
    this.#ultimateCharging = false;
    this.#ultimateCharge = 0;
    this.#lastWave = 0;
    this.#lastResourceWave = 0;
    this.#drones = [];
    this.#effects = [];
    this.#reportedDefeats = new WeakSet();
    this.#nucleusProcessed = new WeakSet();
  }
}
