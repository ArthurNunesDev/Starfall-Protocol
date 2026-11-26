import { Enemy } from "./Enemy.js";

export class EnemyManager {
  #assets;
  #enemies = [];

  constructor(assets) {
    this.#assets = assets;
  }

  spawn(type, x, y) {
    const enemy = new Enemy(type, x, y, this.#assets);
    this.#enemies.push(enemy);
    return enemy;
  }

  spawnInitialWave(player, world) {
    if (this.#enemies.length > 0) return;
    const x = Math.min(world.width - 80, player.x + 280);
    const y = Math.min(world.height - 80, Math.max(80, player.y + 80));
    this.spawn("brute", x, y);
  }

  update(player, deltaTime, world) {
    for (const enemy of this.#enemies) enemy.update(player, deltaTime, world);
  }

  render(ctx) {
    for (const enemy of this.#enemies) enemy.render(ctx);
  }

  get count() { return this.#enemies.length; }
}
