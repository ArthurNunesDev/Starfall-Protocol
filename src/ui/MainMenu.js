export class MainMenu {
  #screenManager;
  #game;

  constructor(screenManager, game) {
    this.#screenManager = screenManager;
    this.#game = game;
    document.addEventListener("click", this.#handleClick);
    document.addEventListener("keydown", this.#handleKeydown);
    const motionToggle = document.querySelector("#reduced-motion");
    motionToggle?.addEventListener("change", (event) => {
      document.body.classList.toggle("reduce-motion", event.currentTarget.checked);
    });
    const fullscreenButton = document.querySelector('[data-action="fullscreen"]');
    fullscreenButton?.addEventListener("click", () => this.#toggleFullscreen(fullscreenButton));
  }

  #handleClick = (event) => {
    const screenButton = event.target.closest("[data-screen]");
    if (screenButton) {
      if (screenButton.dataset.screen === "main-menu") this.#game.stop();
      this.#screenManager.show(screenButton.dataset.screen);
      return;
    }

    if (!event.target.closest('[data-action="start-game"]')) return;
    this.#screenManager.show("game-screen");
    try {
      this.#game.start();
    } catch (error) {
      this.#screenManager.show("main-menu");
      console.error("Não foi possível iniciar a arena:", error);
    }
  };

  #handleKeydown = (event) => {
    if (event.key === "Escape" && this.#screenManager.currentScreen !== "main-menu"
      && this.#screenManager.currentScreen !== "startup-screen") {
      if (this.#screenManager.currentScreen === "game-screen") this.#game.stop();
      this.#screenManager.show("main-menu");
      return;
    }
    if (!["ArrowDown", "ArrowUp"].includes(event.key)
      || this.#screenManager.currentScreen !== "main-menu") return;
    const buttons = [...document.querySelectorAll("#main-menu [data-screen], #main-menu [data-action]")];
    const index = buttons.indexOf(document.activeElement);
    const next = index < 0 ? 0 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  };

  async #toggleFullscreen(button) {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else throw new Error("Tela cheia não é suportada neste navegador.");
      button.textContent = document.fullscreenElement ? "SAIR DA TELA CHEIA" : "ATIVAR ↗";
    } catch (error) {
      console.error("Não foi possível alterar o modo de tela cheia:", error);
      button.textContent = "INDISPONÍVEL";
    }
  }
}
