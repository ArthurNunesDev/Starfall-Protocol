import { Camera } from "./Camera.js";
import { GameLoop } from "./GameLoop.js";
import { Input } from "./Input.js";
import { Player } from "./Player.js";
import { Renderer } from "./Renderer.js";
import { WORLD } from "./World.js";


export class Game {
  #input = new Input();
  #renderer;
  #player = new Player(WORLD.width / 2, WORLD.height / 2);
  #camera = new Camera();
  #loop;
  #running = false;

  constructor(canvas) {
    this.#renderer = new Renderer(canvas);
    this.#loop = new GameLoop({
      update: (deltaTime) => this.update(deltaTime),
      render: () => this.render(),
    });
  }

  start() {
    if (this.#running) return;
    this.#renderer.resize();
    this.#camera.snapTo(this.#player, this.#renderer.width, this.#renderer.height, WORLD);
    this.#input.attach();
    this.#running = true;
    this.#loop.start();
  }

  stop() {
    if (!this.#running) return;
    this.#running = false;
    this.#loop.stop();
    this.#input.detach();
  }

  update(deltaTime) {
    this.#player.update(this.#input, deltaTime, WORLD);
    this.#camera.follow(this.#player, this.#renderer.width, this.#renderer.height, WORLD, deltaTime);
  }

  render() {
    this.#renderer.render({ world: WORLD, player: this.#player, camera: this.#camera });
  }
}
