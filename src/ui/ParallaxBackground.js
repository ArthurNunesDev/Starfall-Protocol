export class ParallaxBackground {
  #root;
  #frameId = null;
  #targetX = 0;
  #targetY = 0;
  #currentX = 0;
  #currentY = 0;
  #reducedMotion;

  constructor(root = document.documentElement) {
    this.#root = root;
    this.#reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (this.#reducedMotion.matches) return;

    window.addEventListener("pointermove", this.#handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", this.#handlePointerLeave);
    this.#reducedMotion.addEventListener("change", this.#handleMotionPreference);
  }

  #handlePointerMove = (event) => {
    if (event.pointerType === "touch" || this.#reducedMotion.matches) return;

    this.#targetX = (event.clientX / window.innerWidth - 0.5) * 18;
    this.#targetY = (event.clientY / window.innerHeight - 0.5) * 14;

    if (this.#frameId === null) {
      this.#frameId = window.requestAnimationFrame(this.#animate);
    }
  };

  #handlePointerLeave = () => {
    this.#targetX = 0;
    this.#targetY = 0;

    if (this.#frameId === null && !this.#reducedMotion.matches) {
      this.#frameId = window.requestAnimationFrame(this.#animate);
    }
  };

  #handleMotionPreference = (event) => {
    if (event.matches) {
      if (this.#frameId !== null) window.cancelAnimationFrame(this.#frameId);
      this.#frameId = null;
      this.#currentX = 0;
      this.#currentY = 0;
      this.#root.style.setProperty("--motion-x", "0px");
      this.#root.style.setProperty("--motion-y", "0px");
    }
  };

  #animate = () => {
    this.#currentX += (this.#targetX - this.#currentX) * 0.055;
    this.#currentY += (this.#targetY - this.#currentY) * 0.055;

    this.#root.style.setProperty("--motion-x", `${this.#currentX.toFixed(2)}px`);
    this.#root.style.setProperty("--motion-y", `${this.#currentY.toFixed(2)}px`);

    if (Math.abs(this.#targetX - this.#currentX) > 0.08 || Math.abs(this.#targetY - this.#currentY) > 0.08) {
      this.#frameId = window.requestAnimationFrame(this.#animate);
    } else {
      this.#frameId = null;
    }
  };
}
