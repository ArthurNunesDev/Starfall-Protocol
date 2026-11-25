export class MainMenu {
  #screenManager;

  constructor(screenManager) {
    this.#screenManager = screenManager;
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
    const button = event.target.closest("[data-screen]");
    if (!button) return;

    this.#screenManager.show(button.dataset.screen);
  };

  #handleKeydown = (event) => {
    if (event.key === "Escape" && this.#screenManager.currentScreen !== "main-menu"
      && this.#screenManager.currentScreen !== "startup-screen") {
      this.#screenManager.show("main-menu");
      return;
    }

    if (!["ArrowDown", "ArrowUp"].includes(event.key)
      || this.#screenManager.currentScreen !== "main-menu") return;

    const buttons = [...document.querySelectorAll("#main-menu [data-screen]")];
    const currentIndex = buttons.indexOf(document.activeElement);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + buttons.length) % buttons.length;

    event.preventDefault();
    buttons[nextIndex]?.focus();
  };

  async #toggleFullscreen(button) {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        throw new Error("Tela cheia não é suportada neste navegador.");
      }

      button.textContent = document.fullscreenElement ? "SAIR DA TELA CHEIA" : "ATIVAR ↗";
    } catch (error) {
      console.error("Não foi possível alterar o modo de tela cheia:", error);
      button.textContent = "INDISPONÍVEL";
    }
  }
}
