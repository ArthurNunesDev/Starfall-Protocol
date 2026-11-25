import { Game } from "./core/Game.js";
import { ScreenManager } from "./ui/ScreenManager.js";
import { StartupScreen } from "./ui/StartupScreen.js";
import { MainMenu } from "./ui/MainMenu.js";
import { ParallaxBackground } from "./ui/ParallaxBackground.js";

const canvas = document.querySelector("#game-canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Canvas principal do jogo não encontrado.");
}

const screenManager = new ScreenManager();
const game = new Game(canvas);
new MainMenu(screenManager, game);
new ParallaxBackground();

const startupScreen = new StartupScreen(screenManager);
screenManager.show("startup-screen", { announce: false });
startupScreen.start();
