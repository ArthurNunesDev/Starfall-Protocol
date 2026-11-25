const MOVEMENT_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD",
  "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
]);

export class Input {
  #pressedKeys = new Set();
  #attached = false;

  #handleKeyDown = (event) => {
    if (!MOVEMENT_KEYS.has(event.code)) return;
    event.preventDefault();
    this.#pressedKeys.add(event.code);
  };

  #handleKeyUp = (event) => this.#pressedKeys.delete(event.code);
  #clearPressedKeys = () => this.#pressedKeys.clear();

  attach() {
    if (this.#attached) return;
    window.addEventListener("keydown", this.#handleKeyDown);
    window.addEventListener("keyup", this.#handleKeyUp);
    window.addEventListener("blur", this.#clearPressedKeys);
    this.#attached = true;
  }

  detach() {
    if (!this.#attached) return;
    window.removeEventListener("keydown", this.#handleKeyDown);
    window.removeEventListener("keyup", this.#handleKeyUp);
    window.removeEventListener("blur", this.#clearPressedKeys);
    this.#clearPressedKeys();
    this.#attached = false;
  }

  isPressed(code) { return this.#pressedKeys.has(code); }
}
