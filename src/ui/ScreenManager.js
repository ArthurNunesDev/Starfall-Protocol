export class ScreenManager {
  #screens;
  #announcer;
  #currentScreen = null;

  constructor() {
    this.#screens = [...document.querySelectorAll(".screen")];
    this.#announcer = document.querySelector("#interface-announcer");

    if (this.#screens.length === 0) {
      throw new Error("Nenhuma tela da interface foi encontrada.");
    }
  }

  show(screenId, { announce = true } = {}) {
    const target = this.#screens.find((screen) => screen.id === screenId);

    if (!target) {
      console.error(`Tela "${screenId}" não encontrada.`);
      return false;
    }

    for (const screen of this.#screens) {
      screen.hidden = screen !== target;
    }

    this.#currentScreen = screenId;
    const heading = target.querySelector("h1, h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });

    if (announce && this.#announcer && heading) {
      this.#announcer.textContent = `Tela aberta: ${heading.textContent.trim()}.`;
    }

    return true;
  }

  get currentScreen() {
    return this.#currentScreen;
  }
}
