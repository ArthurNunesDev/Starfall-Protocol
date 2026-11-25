import { Game } from "./core/Game.js";

const canvas = document.querySelector("#game-canvas");

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Elemento canvas "#game-canvas" não foi encontrado.');
}

const game = new Game(canvas);
game.start();
