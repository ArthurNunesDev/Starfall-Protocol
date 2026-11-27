const MOVEMENT_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD",
  "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
]);
const ABILITY_KEYS = new Set(["KeyQ", "KeyZ", "KeyX", "KeyC", "KeyV"]);

export class Input {
  #pressedKeys = new Set();
  #justPressed = new Set();
  #justReleased = new Set();
  #attached = false;
  #canvas = null;
  #mousePosition = null;

  #handleKeyDown = (event) => {
    if (!MOVEMENT_KEYS.has(event.code) && !ABILITY_KEYS.has(event.code)) return;
    event.preventDefault();
    if (!this.#pressedKeys.has(event.code)) this.#justPressed.add(event.code);
    this.#pressedKeys.add(event.code);
  };

  #handleKeyUp = (event) => {
    if (this.#pressedKeys.delete(event.code)) this.#justReleased.add(event.code);
  };

  #clearPressedKeys = () => {
    for (const code of this.#pressedKeys) this.#justReleased.add(code);
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
    this.#justPressed.clear();
    this.#justReleased.clear();
    this.#canvas = null;
    this.#attached = false;
  }

  isPressed(code) { return this.#pressedKeys.has(code); }

  consumePressed(code) {
    const pressed = this.#justPressed.has(code);
    this.#justPressed.delete(code);
    return pressed;
  }

  consumeReleased(code) {
    const released = this.#justReleased.has(code);
    this.#justReleased.delete(code);
    return released;
  }

  get mousePosition() { return this.#mousePosition; }
}
