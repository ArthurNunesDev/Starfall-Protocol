const MOVEMENT_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD",
  "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
]);

export class Input {
  #pressedKeys = new Set();
  #attached = false;
  #canvas = null;
  #mousePosition = null;

  #handleKeyDown = (event) => {
    if (!MOVEMENT_KEYS.has(event.code)) return;
    event.preventDefault();
    this.#pressedKeys.add(event.code);
  };

  #handleKeyUp = (event) => this.#pressedKeys.delete(event.code);
  #clearPressedKeys = () => {
    this.#pressedKeys.clear();
    this.#mousePosition = null;
  };

  #handlePointerMove = (event) => {
    if (!this.#canvas) return;
    const rect = this.#canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      this.#mousePosition = null;
      return;
    }

    this.#mousePosition = {
      x: (event.clientX - rect.left) * (this.#canvas.clientWidth / rect.width),
      y: (event.clientY - rect.top) * (this.#canvas.clientHeight / rect.height),
    };
  };

  #handlePointerLeave = () => {
    this.#mousePosition = null;
  };

  attach(canvas) {
    if (this.#attached) return;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError("Input exige um Canvas válido para rastrear o cursor.");
    }

    this.#canvas = canvas;
    window.addEventListener("keydown", this.#handleKeyDown);
    window.addEventListener("keyup", this.#handleKeyUp);
    window.addEventListener("blur", this.#clearPressedKeys);
    canvas.addEventListener("pointermove", this.#handlePointerMove);
    canvas.addEventListener("pointerleave", this.#handlePointerLeave);
    this.#attached = true;
  }

  detach() {
    if (!this.#attached) return;
    window.removeEventListener("keydown", this.#handleKeyDown);
    window.removeEventListener("keyup", this.#handleKeyUp);
    window.removeEventListener("blur", this.#clearPressedKeys);
    this.#canvas?.removeEventListener("pointermove", this.#handlePointerMove);
    this.#canvas?.removeEventListener("pointerleave", this.#handlePointerLeave);
    this.#clearPressedKeys();
    this.#canvas = null;
    this.#attached = false;
  }

  isPressed(code) { return this.#pressedKeys.has(code); }
  get mousePosition() { return this.#mousePosition; }
}
