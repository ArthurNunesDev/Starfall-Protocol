# Starfall Protocol

Jogo Survivors-like desenvolvido individualmente com **HTML, CSS e JavaScript puro**, utilizando Canvas 2D e módulos ES.

## Conceito

Em um universo sci-fi original, sobreviva a hordas temporizadas em uma experiência top-down. Elimine inimigos, colete experiência, evolua durante cada partida e desbloqueie personagens ao cumprir objetivos.

## Tecnologias

- HTML5 e CSS3
- JavaScript ES Modules
- Canvas 2D
- LocalStorage (quando os sistemas de progresso forem implementados)
- GitHub Pages

O projeto não utiliza bibliotecas, frameworks ou engines de jogos.

## Executar localmente

Como o projeto utiliza módulos JavaScript, execute-o por um servidor HTTP local.

Com Python:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000`.

## Estrutura atual

```text
.
├── index.html
├── README.md
├── src/
│   ├── main.js
│   └── core/
│       ├── Game.js
│       ├── GameLoop.js
│       ├── Input.js
│       └── Renderer.js
└── styles/
    └── main.css
```

## Planejamento

1. **Fundação:** estrutura, Canvas, loop principal e entrada do teclado.
2. **Jogador:** movimentação, câmera follow, vida e colisões.
3. **Combate:** armas automáticas, habilidades manuais e projéteis.
4. **Hordas:** geração temporizada, inimigos e dificuldade progressiva.
5. **Progressão:** experiência, níveis e aprimoramentos.
6. **Conteúdo:** chefes, novos inimigos, armas e personagens desbloqueáveis.
7. **Finalização:** menus, áudio, persistência, balanceamento e testes.
8. **Publicação:** configuração e validação do GitHub Pages.

## Diretrizes

- Código próprio, sem engines ou bibliotecas de jogos.
- Responsabilidades separadas em módulos.
- Desenvolvimento incremental, com validação a cada etapa.
- Commits em português, pequenos e objetivos.
- Não adicionar funcionalidades fora do escopo definido.

## Status

**Etapa 1 — Fundação:** estrutura inicial e ciclo principal do jogo.
