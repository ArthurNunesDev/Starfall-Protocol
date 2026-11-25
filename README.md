# Starfall Protocol

[![Publicação no GitHub Pages](https://github.com/ArthurNunesDev/Starfall-Protocol/actions/workflows/deploy.yml/badge.svg)](https://github.com/ArthurNunesDev/Starfall-Protocol/actions/workflows/deploy.yml)

## Jogue

**[Acessar Starfall Protocol](https://arthurnunesdev.github.io/Starfall-Protocol/)**

O jogo é publicado automaticamente pelo GitHub Actions a cada atualização enviada para a branch `main`.

Jogo Survivors-like sci-fi desenvolvido individualmente com **HTML, CSS e JavaScript puro**, utilizando Canvas 2D e módulos ES.

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
│   ├── core/
│   │   ├── Game.js
│   │   ├── GameLoop.js
│   │   ├── Input.js
│   │   └── Renderer.js
│   └── ui/
│       ├── MainMenu.js
│       ├── ParallaxBackground.js
│       ├── ScreenManager.js
│       └── StartupScreen.js
└── styles/
    ├── main.css
    └── menu.css
```

## Planejamento

1. **Fundação:** estrutura, Canvas, loop principal e entrada do teclado.
2. **Interface:** inicialização, menu principal, telas secundárias e cenário parallax.
3. **Jogador:** movimentação, câmera follow, vida e colisões.
4. **Combate:** armas automáticas, habilidades manuais e projéteis.
5. **Hordas:** geração temporizada, inimigos e dificuldade progressiva.
6. **Progressão:** experiência, níveis e aprimoramentos.
7. **Conteúdo:** chefes, novos inimigos, armas e personagens desbloqueáveis.
8. **Finalização:** áudio, persistência, balanceamento e testes.
9. **Publicação:** configuração e validação do GitHub Pages.

## Diretrizes

- Código próprio, sem engines ou bibliotecas de jogos.
- Responsabilidades separadas em módulos.
- Desenvolvimento incremental, com validação a cada etapa.
- Commits em português, pequenos e objetivos.
- Não adicionar funcionalidades fora do escopo definido.

## Status

**Etapa 3 — Jogador:** movimentação top-down, arena de teste, câmera follow e limites do mapa.
