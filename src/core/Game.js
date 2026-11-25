import { GameLoop } from "./GameLoop.js";
import { Input } from "./Input.js";
import { Renderer } from "./Renderer.js";

export class Game {
  #input;
  #renderer;
  #loop;

  constructor(canvas) {
    this.#input = new Input();
    this.#renderer = new Renderer(canvas);
    this.#loop = new GameLoop({
      update: (deltaTime) => this.update(deltaTime),
      render: () => this.render(),
    });
  }

  start() {
    this.#input.attach();
    this.#loop.start();
  }

  update(_deltaTime) {
    // Os sistemas de gameplay serão integrados nas próximas etapas.
  }

  render() {
    this.#renderer.clear();
  }
}
