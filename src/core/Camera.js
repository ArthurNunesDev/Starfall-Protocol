export class Camera {
  x = 0;
  y = 0;
  #initialized = false;

  snapTo(target, width, height, world) {
    this.x = this.#clamp(target.x - width / 2, 0, world.width - width);
    this.y = this.#clamp(target.y - height / 2, 0, world.height - height);
    this.#initialized = true;
  }

  follow(target, width, height, world, deltaTime) {
    const targetX = this.#clamp(target.x - width / 2, 0, world.width - width);
    const targetY = this.#clamp(target.y - height / 2, 0, world.height - height);
    if (!this.#initialized) {
      this.x = targetX;
      this.y = targetY;
      this.#initialized = true;
      return;
    }
    const factor = 1 - Math.exp(-9 * deltaTime);
    this.x += (targetX - this.x) * factor;
    this.y += (targetY - this.y) * factor;
  }

  #clamp(value, min, max) {
    return max < min ? min : Math.max(min, Math.min(max, value));
  }
}
