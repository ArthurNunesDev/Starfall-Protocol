import { ScreenManager } from "./ui/ScreenManager.js";
import { StartupScreen } from "./ui/StartupScreen.js";
import { MainMenu } from "./ui/MainMenu.js";
import { ParallaxBackground } from "./ui/ParallaxBackground.js";

const screenManager = new ScreenManager();

new MainMenu(screenManager);
new ParallaxBackground();

const startupScreen = new StartupScreen(screenManager);
screenManager.show("startup-screen", { announce: false });
startupScreen.start();
