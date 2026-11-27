import { WORLD } from "./World.js";

export class Renderer {
  #canvas;
  #context;
  #observer;
  #width = 0;
  #height = 0;
  #pixelRatio = 1;
  #stars;

  constructor(canvas) {
    if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError("Renderer exige um Canvas válido.");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Não foi possível inicializar o contexto 2D do Canvas.");
    this.#canvas = canvas;
    this.#context = context;
    this.#stars = Array.from({ length: 150 }, (_, i) => ({
      x: (i * 197 + 83) % WORLD.width,
      y: (i * 311 + 47) % WORLD.height,
      radius: i % 9 === 0 ? 1.7 : 0.8,
      alpha: 0.2 + ((i * 13) % 60) / 100,
    }));
    this.#observer = new ResizeObserver(() => this.resize());
    this.#observer.observe(canvas);
  }

  get width() { return this.#width; }
  get height() { return this.#height; }

  resize() {
    const rect = this.#canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.#width = rect.width;
    this.#height = rect.height;
    this.#pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(this.#width * this.#pixelRatio);
    const height = Math.round(this.#height * this.#pixelRatio);
    if (this.#canvas.width !== width || this.#canvas.height !== height) {
      this.#canvas.width = width;
      this.#canvas.height = height;
    }
    this.#context.setTransform(this.#pixelRatio, 0, 0, this.#pixelRatio, 0, 0);
  }

  render({ world, player, enemies, weapons, camera, elapsedTime = 0, enemyCount = 0, health = 100, maxHealth = 100, kills = 0, wave = 1 }) {
    const ctx = this.#context;
    ctx.setTransform(this.#pixelRatio, 0, 0, this.#pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.#width, this.#height);
    ctx.fillStyle = "#050b16";
    ctx.fillRect(0, 0, this.#width, this.#height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    this.#renderWorld(world, camera);
    enemies?.render(ctx);
    weapons?.render(ctx);
    player.render(ctx);
    ctx.restore();
    this.#renderHud({ elapsedTime, enemyCount, health, maxHealth, kills, wave });
  }

  #renderHud({ elapsedTime, enemyCount, health, maxHealth, kills, wave }) {
    const ctx = this.#context;
    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, "0");
    const seconds = Math.floor(elapsedTime % 60).toString().padStart(2, "0");
    ctx.save();
    ctx.textAlign = "left";
    ctx.font = "600 11px Rajdhani, sans-serif";
    ctx.fillStyle = "rgba(121, 234, 255, 0.82)";
    ctx.fillText("ARMAMENTO  ·  FUZIL DE PULSO", 20, this.#height - 18);
    ctx.textAlign = "right";
    ctx.fillStyle = "#a9bdcf";
    ctx.fillText(`WAVE  ${wave} / 100   //   ${minutes}:${seconds}`, this.#width - 20, 30);
    ctx.fillText(`AMEAÇAS  ${enemyCount}   //   ELIMINAÇÕES  ${kills}`, this.#width - 20, 49);
    ctx.restore();
  }

  #renderWorld(world, camera) {
    const ctx = this.#context;
    ctx.fillStyle = "#071321";
    ctx.fillRect(0, 0, world.width, world.height);
    const left = Math.max(0, Math.floor(camera.x / 80) * 80);
    const right = Math.min(world.width, camera.x + this.#width + 80);
    const top = Math.max(0, Math.floor(camera.y / 80) * 80);
    const bottom = Math.min(world.height, camera.y + this.#height + 80);
    ctx.beginPath();
    ctx.strokeStyle = "rgba(75, 151, 183, 0.10)";
    ctx.lineWidth = 1;
    for (let x = left; x <= right; x += 80) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = top; y <= bottom; y += 80) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    for (const star of this.#stars) {
      if (star.x < camera.x - 8 || star.x > camera.x + this.#width + 8
        || star.y < camera.y - 8 || star.y > camera.y + this.#height + 8) continue;
      ctx.beginPath();
      ctx.fillStyle = `rgba(166, 222, 244, ${star.alpha})`;
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(105, 229, 245, 0.5)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, world.width, world.height);
    ctx.strokeStyle = "rgba(105, 229, 245, 0.08)";
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, world.width - 12, world.height - 12);
  }
}
