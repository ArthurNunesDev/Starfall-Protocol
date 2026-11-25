export class Input {
  #pressedKeys = new Set();
  #attached = false;

  #handleKeyDown = (event) => {
    this.#pressedKeys.add(event.code);
  };

  #handleKeyUp = (event) => {
    this.#pressedKeys.delete(event.code);
  };

  #clearPressedKeys = () => {
    this.#pressedKeys.clear();
  };

  attach() {
    if (this.#attached) return;

    window.addEventListener("keydown", this.#handleKeyDown);
    window.addEventListener("keyup", this.#handleKeyUp);
    window.addEventListener("blur", this.#clearPressedKeys);

    this.#attached = true;
  }

  isPressed(code) {
    return this.#pressedKeys.has(code);
  }
}
