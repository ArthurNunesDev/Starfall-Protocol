export class Renderer {
  #canvas;
  #context;

  constructor(canvas) {
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível inicializar o contexto 2D do Canvas.");
    }

    this.#canvas = canvas;
    this.#context = context;
  }

  clear() {
    this.#context.clearRect(
      0,
      0,
      this.#canvas.width,
      this.#canvas.height,
    );

    this.#context.fillStyle = "#070b12";
    this.#context.fillRect(
      0,
      0,
      this.#canvas.width,
      this.#canvas.height,
    );
  }
}
