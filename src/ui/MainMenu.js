export class MainMenu {
  #screenManager;
  #game;
  #profile;

  constructor(screenManager, game, profile) {
    this.#screenManager = screenManager;
    this.#game = game;
    this.#profile = profile;
    document.addEventListener("click", this.#handleClick);
    document.addEventListener("keydown", this.#handleKeydown);
    document.addEventListener("fullscreenchange", this.#handleFullscreenChange);
    this.#renderCharacterSelection();
    this.#refreshArchives();

    const motionToggle = document.querySelector("#reduced-motion");
    motionToggle?.addEventListener("change", (event) => {
      document.body.classList.toggle("reduce-motion", event.currentTarget.checked);
    });

    const fullscreenButton = document.querySelector('[data-action="fullscreen"]');
    fullscreenButton?.addEventListener("click", () => this.#toggleFullscreen(fullscreenButton));
  }

  #handleClick = (event) => {
    const characterButton = event.target.closest("[data-character-id]");
    if (characterButton) {
      this.#profile.selectCharacter(characterButton.dataset.characterId);
      this.#renderCharacterSelection();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton?.dataset.action === "enter-game") {
      this.#renderCharacterSelection();
      this.#screenManager.show("character-select-screen");
      return;
    }

    if (actionButton?.dataset.action === "restart-game") {
      this.#screenManager.show("game-screen");
      this.#game.restart();
      return;
    }

    if (actionButton?.dataset.action === "start-selected-game") {
      const profile = this.#profile.getProfile();
      if (!profile.unlockedCharacters.includes(profile.selectedCharacter)) {
        this.#renderCharacterSelection();
        return;
      }

      this.#screenManager.show("game-screen");
      try {
        this.#game.start(profile.selectedCharacter);
      } catch (error) {
        this.#game.endSession();
        this.#screenManager.show("main-menu");
        console.error("Não foi possível iniciar a arena:", error);
      }
      return;
    }

    const gameFullscreenButton = event.target.closest('[data-action="game-fullscreen"]');
    if (gameFullscreenButton) {
      this.#toggleGameFullscreen(gameFullscreenButton);
      return;
    }

    const screenButton = event.target.closest("[data-screen]");
    if (screenButton) {
      if (screenButton.dataset.screen === "main-menu"
        && ["game-screen", "death-screen"].includes(this.#screenManager.currentScreen)) {
        this.#game.endSession();
      }
      if (screenButton.dataset.screen === "main-menu") this.#refreshArchives();
      if (screenButton.dataset.screen === "character-select-screen") this.#renderCharacterSelection();
      this.#screenManager.show(screenButton.dataset.screen);
      return;
    }
  };

  #handleKeydown = (event) => {
    if (event.key === "Escape" && this.#screenManager.currentScreen === "game-screen") {
      const viewport = document.querySelector(".game-viewport");
      if (document.fullscreenElement === viewport) {
        event.preventDefault();
        document.exitFullscreen().catch((error) => {
          console.error("Não foi possível sair da tela cheia:", error);
        });
        return;
      }
    }

    if (event.key === "Escape" && this.#screenManager.currentScreen !== "main-menu"
      && this.#screenManager.currentScreen !== "startup-screen") {
      if (this.#screenManager.currentScreen === "game-screen") this.#game.endSession();
      this.#refreshArchives();
      this.#screenManager.show("main-menu");
      return;
    }

    if (!["ArrowDown", "ArrowUp"].includes(event.key)
      || this.#screenManager.currentScreen !== "main-menu") return;
    const buttons = [...document.querySelectorAll("#main-menu [data-screen]:not(:disabled), #main-menu [data-action]:not(:disabled)")];
    const index = buttons.indexOf(document.activeElement);
    const next = index < 0 ? 0 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  };

  #handleFullscreenChange = () => {
    const button = document.querySelector('[data-action="game-fullscreen"]');
    const viewport = document.querySelector(".game-viewport");
    if (!button || !viewport) return;

    const isFullscreen = document.fullscreenElement === viewport;
    button.textContent = isFullscreen ? "SAIR DA TELA CHEIA" : "TELA CHEIA";
    button.setAttribute("aria-label", isFullscreen ? "Sair da tela cheia" : "Expandir mapa para tela cheia");
  };

  #renderCharacterSelection() {
    const profile = this.#profile.getProfile();
    const characterButton = document.querySelector('[data-character-id="operator-01"]');
    const startButton = document.querySelector('[data-action="start-selected-game"]');
    const isUnlocked = profile.unlockedCharacters.includes("operator-01");
    const isSelected = profile.selectedCharacter === "operator-01" && isUnlocked;

    if (characterButton) {
      characterButton.disabled = !isUnlocked;
      characterButton.classList.toggle("is-selected", isSelected);
      characterButton.setAttribute("aria-pressed", String(isSelected));
      const selection = characterButton.querySelector(".character-card__selection");
      if (selection) selection.textContent = isSelected ? "SELECIONADO" : "SELECIONAR";
    }
    if (startButton) startButton.disabled = !profile.unlockedCharacters.includes(profile.selectedCharacter);
  }

  #refreshArchives() {
    const profile = this.#profile.getProfile();
    this.#renderArchive("weapons", profile.unlockedWeapons);
    this.#renderArchive("enemies", profile.defeatedEnemies);
  }

  #renderArchive(type, entries) {
    const menuButton = document.querySelector(`[data-archive-button="${type}"]`);
    const lockState = document.querySelector(`[data-archive-lock="${type}"]`);
    const list = document.querySelector(`[data-archive-list="${type}"]`);
    const hasEntries = entries.length > 0;

    if (menuButton) {
      menuButton.disabled = !hasEntries;
      menuButton.title = hasEntries ? "" : (type === "weapons"
        ? "Desbloqueie uma arma durante uma partida."
        : "Derrote um inimigo para liberar o índice de inimigos.");
      const lockLabel = menuButton.querySelector(".menu-button__lock");
      if (lockLabel) lockLabel.textContent = hasEntries ? "" : "BLOQUEADO";
    }

    if (lockState) lockState.hidden = hasEntries;
    if (!list) return;
    list.replaceChildren();
    list.hidden = !hasEntries;

    for (const entry of entries) {
      const card = document.createElement("article");
      card.className = "archive-card";
      const title = document.createElement("strong");
      title.textContent = entry.name;
      const description = document.createElement("p");
      description.textContent = entry.description || "Registro desbloqueado.";
      const code = document.createElement("span");
      code.textContent = entry.id.toUpperCase();
      card.append(title, description, code);
      list.append(card);
    }
  }

  async #toggleGameFullscreen(button) {
    const viewport = document.querySelector(".game-viewport");
    if (!viewport) return;

    try {
      if (document.fullscreenElement === viewport) {
        await document.exitFullscreen();
      } else {
        if (!viewport.requestFullscreen) {
          throw new Error("Tela cheia não é suportada neste navegador.");
        }
        await viewport.requestFullscreen();
      }
    } catch (error) {
      console.error("Não foi possível alterar o modo de tela cheia do mapa:", error);
      button.textContent = "INDISPONÍVEL";
    }
  }

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
