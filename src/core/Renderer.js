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

  render({ world, player, enemies, weapons, abilities, camera, elapsedTime = 0, enemyCount = 0, kills = 0, wave = 1 }) {
    const ctx = this.#context;
    ctx.setTransform(this.#pixelRatio, 0, 0, this.#pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.#width, this.#height);
    ctx.fillStyle = "#050b16";
    ctx.fillRect(0, 0, this.#width, this.#height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    this.#renderWorld(world, camera);
    enemies?.render(ctx);
    abilities?.render(ctx);
    weapons?.render(ctx);
    player.render(ctx, abilities?.weaponVisualState ?? null);
    ctx.restore();
    this.#renderHud({ elapsedTime, enemyCount, kills, wave, player, abilities: abilities?.hudState ?? null });
  }

  #renderHud({ elapsedTime, enemyCount, kills, wave, player, abilities }) {
    const ctx = this.#context;
    const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, "0");
    const seconds = Math.floor(elapsedTime % 60).toString().padStart(2, "0");
    ctx.save();
    ctx.textAlign = "left";
    ctx.font = "600 11px Rajdhani, sans-serif";
    ctx.fillStyle = "rgba(121, 234, 255, 0.82)";
    ctx.fillText("ARMAMENTO  ·  FUZIL DE PULSO", 20, this.#height - 18);
    if (player?.totalShield > 0) {
      ctx.fillStyle = player.emergencyShield > 0 ? "#ffd170" : "#75eaff";
      ctx.fillText("ESCUDO  " + Math.ceil(player.totalShield), 20, 30);
    }
    ctx.textAlign = "right";
    ctx.fillStyle = "#a9bdcf";
    ctx.fillText(`WAVE  ${wave} / 100   //   ${minutes}:${seconds}`, this.#width - 20, 30);
    ctx.fillText(`AMEAÇAS  ${enemyCount}   //   ELIMINAÇÕES  ${kills}`, this.#width - 20, 70);
    this.#renderAbilityHud(abilities);
    ctx.restore();
  }

  #renderAbilityHud(state) {
    if (!state) return;
    const ctx = this.#context;
    const slots = [
      { key: "Q", label: "FENDA", status: state.riftCharges + "/2", ready: state.riftCharges > 0 },
      { key: "Z", label: "PULSO", status: state.pulseCooldown > 0 ? state.pulseCooldown.toFixed(1) + "s" : "PRONTO", ready: state.pulseCooldown <= 0 },
      { key: "X", label: "SOBRECARGA", status: state.overloadRemaining > 0 ? state.overloadRemaining.toFixed(1) + "s" : state.overloadCooldown > 0 ? state.overloadCooldown.toFixed(1) + "s" : "PRONTO", ready: state.overloadCooldown <= 0 },
      { key: "C", label: "DRONES", status: state.droneCount + "/3" + (state.droneCooldown > 0 ? " · " + state.droneCooldown.toFixed(1) + "s" : ""), ready: state.droneCooldown <= 0 && state.droneCount < 3 },
      { key: "V", label: "LASER", status: state.ultimateCharging ? state.ultimateCharge.toFixed(1) + "/10s" : state.ultimateCooldown > 0 ? state.ultimateCooldown.toFixed(1) + "s" : state.ultimateBuffRemaining > 0 ? "BUFF " + state.ultimateBuffRemaining.toFixed(0) + "s" : "PRONTO", ready: state.ultimateCooldown <= 0 },
    ];
    const width = 68;
    const height = 30;
    const gap = 4;
    const totalWidth = slots.length * width + (slots.length - 1) * gap;
    const startX = Math.max(6, (this.#width - totalWidth) / 2);
    const y = this.#height - 48;

    slots.forEach((slot, index) => {
      const x = startX + index * (width + gap);
      ctx.fillStyle = "rgba(4, 13, 25, 0.86)";
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = slot.ready ? "rgba(86, 210, 235, 0.55)" : "rgba(122, 143, 164, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
      ctx.textAlign = "left";
      ctx.font = "700 9px Rajdhani, sans-serif";
      ctx.fillStyle = slot.ready ? "#8ceeff" : "#91a2b2";
      ctx.fillText(slot.key, x + 5, y + 11);
      ctx.font = "600 8px Rajdhani, sans-serif";
      ctx.fillStyle = "#d8e8f4";
      ctx.fillText(slot.label, x + 17, y + 11);
      ctx.textAlign = "center";
      ctx.font = "600 9px Rajdhani, sans-serif";
      ctx.fillStyle = slot.ready ? "#79e8c5" : "#b0bac5";
      ctx.fillText(slot.status, x + width / 2, y + 24);
      if (slot.key === "V" && state.ultimateCharging) {
        ctx.fillStyle = state.ultimateCharge > 5 ? "#ff526b" : "#70eaff";
        ctx.fillRect(x + 2, y + height - 2, (width - 4) * (state.ultimateCharge / 10), 2);
      }
    });
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
