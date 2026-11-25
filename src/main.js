import { Game } from "./core/Game.js";
import { ScreenManager } from "./ui/ScreenManager.js";
import { StartupScreen } from "./ui/StartupScreen.js";
import { MainMenu } from "./ui/MainMenu.js";
import { ParallaxBackground } from "./ui/ParallaxBackground.js";
import { PlayerProfile } from "./core/PlayerProfile.js";

const canvas = document.querySelector("#game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas principal do jogo não encontrado.");
}

const screenManager = new ScreenManager();
const game = new Game(canvas);
const playerProfile = new PlayerProfile();
new MainMenu(screenManager, game, playerProfile);
new ParallaxBackground();

const startupScreen = new StartupScreen(screenManager);
if (game.restoreSession()) {
  screenManager.show("game-screen", { announce: false });
  game.start();
} else {
  screenManager.show("startup-screen", { announce: false });
  startupScreen.start();
}
