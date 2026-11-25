export class StartupScreen {
  #screenManager;
  #timeoutId = null;
  #skipButton;
  #started = false;

  constructor(screenManager) {
    this.#screenManager = screenManager;
    this.#skipButton = document.querySelector("[data-skip-startup]");

    if (!this.#skipButton) {
      throw new Error("Botão para pular a inicialização não encontrado.");
    }

    this.#skipButton.addEventListener("click", () => this.finish());
  }

  start() {
    if (this.#started) return;
    this.#started = true;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.#timeoutId = window.setTimeout(() => this.finish(), reducedMotion ? 150 : 1550);
  }

  finish() {
    if (this.#timeoutId !== null) {
      window.clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }

    this.#screenManager.show("main-menu", { announce: false });
  }
}
