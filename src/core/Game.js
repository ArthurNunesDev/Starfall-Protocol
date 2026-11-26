import { Camera } from "./Camera.js";
import { GameLoop } from "./GameLoop.js";
import { Input } from "./Input.js";
import { Player } from "./Player.js";
import { Renderer } from "./Renderer.js";
import { GameSession } from "./GameSession.js";
import { WORLD } from "./World.js";
import { loadSoldierAssets } from "./SoldierSprite.js";
import { loadEnemyAssets } from "./EnemySprite.js";
import { EnemyManager } from "./EnemyManager.js";

const PLAYER_RADIUS = 15;
const SAVE_INTERVAL = 1;

export class Game {
  #input = new Input();
  #renderer;
  #spriteAssets = null;
  #enemyAssets = null;
  #enemies = null;
  #player = new Player(WORLD.width / 2, WORLD.height / 2);
  #camera = new Camera();
  #loop;
  #session = new GameSession();
  #running = false;
  #elapsedTime = 0;
  #saveAccumulator = 0;
  #pendingCamera = null;
  #characterId = "operator-01";

  constructor(canvas) {
    this.#renderer = new Renderer(canvas);
    this.#loop = new GameLoop({
      update: (deltaTime) => this.update(deltaTime),
      render: () => this.render(),
    });
    window.addEventListener("pagehide", this.#handlePageHide);
    document.addEventListener("visibilitychange", this.#handleVisibilityChange);
  }

  async loadAssets() {
    const results = await Promise.allSettled([loadSoldierAssets(), loadEnemyAssets()]);
    if (results[0].status === "fulfilled") {
      this.#spriteAssets = results[0].value;
      this.#player.setSpriteAssets(this.#spriteAssets);
    } else {
      console.error("Sprites do operador indisponíveis; será usado o visual reserva:", results[0].reason);
    }
    if (results[1].status === "fulfilled") {
      this.#enemyAssets = results[1].value;
      this.#enemies = new EnemyManager(this.#enemyAssets);
    } else {
      console.error("Sprites dos inimigos indisponíveis; sistema de inimigos desativado:", results[1].reason);
    }
    return results.every((result) => result.status === "fulfilled");
  }

  restoreSession() {
    const savedSession = this.#session.load();
    if (!savedSession) return false;
    this.#player.x = Math.max(PLAYER_RADIUS, Math.min(WORLD.width - PLAYER_RADIUS, savedSession.player.x));
    this.#player.y = Math.max(PLAYER_RADIUS, Math.min(WORLD.height - PLAYER_RADIUS, savedSession.player.y));
    this.#elapsedTime = savedSession.elapsedTime;
    this.#characterId = savedSession.characterId || "operator-01";
    this.#pendingCamera = savedSession.camera;
    return true;
  }

  start(characterId = this.#characterId) {
    if (this.#running) return;
    if (typeof characterId === "string" && characterId.trim()) this.#characterId = characterId;
    this.#renderer.resize();
    if (this.#pendingCamera) {
      this.#camera.restore(this.#pendingCamera.x, this.#pendingCamera.y,
        this.#renderer.width, this.#renderer.height, WORLD);
      this.#pendingCamera = null;
    } else {
      this.#camera.snapTo(this.#player, this.#renderer.width, this.#renderer.height, WORLD);
    }
    this.#enemies?.spawnInitialWave(this.#player, WORLD);
    this.#input.attach();
    this.#running = true;
    this.#loop.start();
  }

  stop() {
    if (!this.#running) return;
    this.#saveSession();
    this.#running = false;
    this.#loop.stop();
    this.#input.detach();
  }

  endSession() {
    this.stop();
    this.#session.clear();
    this.#elapsedTime = 0;
    this.#saveAccumulator = 0;
    this.#pendingCamera = null;
    this.#characterId = "operator-01";
    this.#player = new Player(WORLD.width / 2, WORLD.height / 2, this.#spriteAssets);
    this.#enemies = this.#enemyAssets ? new EnemyManager(this.#enemyAssets) : null;
    this.#camera = new Camera();
  }

  update(deltaTime) {
    this.#player.update(this.#input, deltaTime, WORLD);
    this.#enemies?.update(this.#player, deltaTime, WORLD);
    this.#camera.follow(this.#player, this.#renderer.width, this.#renderer.height, WORLD, deltaTime);
    this.#elapsedTime += deltaTime;
    this.#saveAccumulator += deltaTime;
    if (this.#saveAccumulator >= SAVE_INTERVAL) {
      this.#saveAccumulator %= SAVE_INTERVAL;
      this.#saveSession();
    }
  }

  render() {
    this.#renderer.render({ world: WORLD, player: this.#player, enemies: this.#enemies, camera: this.#camera });
  }

  #saveSession() {
    if (!this.#running) return;
    this.#session.save({ elapsedTime: this.#elapsedTime, characterId: this.#characterId,
      player: this.#player, camera: this.#camera });
  }

  #handlePageHide = () => this.#saveSession();
  #handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") this.#saveSession();
  };
}
