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
- LocalStorage para persistência do perfil e da sessão ativa
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
├── assets/
│   └── sprites/
│       └── soldier.png
├── src/
│   ├── main.js
│   ├── core/
│   │   ├── Camera.js
│   │   ├── Game.js
│   │   ├── GameLoop.js
│   │   ├── GameSession.js
│   │   ├── Input.js
│   │   ├── Player.js
│   │   ├── PlayerProfile.js
│   │   ├── Renderer.js
│   │   └── World.js
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

## Fluxo atual

- **Entrar:** abre a seleção de operadores antes da partida.
- **Personagens:** o operador inicial começa desbloqueado; a seleção é salva no perfil. O operador usa spritesheet pixel art com animações direcionais de idle e corrida; os quadros de combate, dano e morte ficam disponíveis para as próximas etapas.
- **Arsenal:** fica bloqueado até que uma arma seja registrada como desbloqueada.
- **Banco de dados:** fica bloqueado até que o jogador derrote e registre seu primeiro inimigo.
- **Persistência:** perfil de progressão e sessão ativa usam registros separados no LocalStorage.

## Status

**Etapa 3 — Jogador:** movimentação top-down, operador em pixel art com oito direções, animações de idle e corrida, arena de teste, câmera follow e limites do mapa. A sessão ativa é restaurada após recarregar a página; o perfil mantém a seleção e os desbloqueios.
