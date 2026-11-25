export class GameLoop {
  #update;
  #render;
  #animationFrameId = null;
  #previousTimestamp = 0;
  #running = false;

  constructor({ update, render }) {
    if (typeof update !== "function" || typeof render !== "function") {
      throw new TypeError("GameLoop exige funções update e render.");
    }

    this.#update = update;
    this.#render = render;
  }

  start() {
    if (this.#running) return;

    this.#running = true;
    this.#previousTimestamp = 0;
    this.#animationFrameId = requestAnimationFrame(
      (timestamp) => this.#frame(timestamp),
    );
  }

  stop() {
    if (!this.#running) return;

    this.#running = false;

    if (this.#animationFrameId !== null) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }
  }

  #frame(timestamp) {
    if (!this.#running) return;

    const deltaTime = this.#previousTimestamp === 0
      ? 0
      : Math.min((timestamp - this.#previousTimestamp) / 1000, 0.05);

    this.#previousTimestamp = timestamp;
    this.#update(deltaTime);
    this.#render();

    this.#animationFrameId = requestAnimationFrame(
      (nextTimestamp) => this.#frame(nextTimestamp),
    );
  }
}
