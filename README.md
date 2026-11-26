# Starfall Protocol

[![Publicação no GitHub Pages](https://github.com/ArthurNunesDev/Starfall-Protocol/actions/workflows/deploy.yml/badge.svg)](https://github.com/ArthurNunesDev/Starfall-Protocol/actions/workflows/deploy.yml)

## Jogue

**[Acessar Starfall Protocol](https://arthurnunesdev.github.io/Starfall-Protocol/)**

Jogo Survivors-like sci-fi desenvolvido com HTML, CSS e JavaScript puro, utilizando Canvas 2D e módulos ES.

## Tecnologias

- HTML5, CSS3 e JavaScript ES Modules
- Canvas 2D
- LocalStorage
- GitHub Pages

## Estrutura

- `src/core/Player.js`: movimentação e renderização do operador.
- `src/core/Enemy.js`: entidade inimiga com perseguição e animação direcional.
- `src/core/EnemyManager.js`: criação e atualização dos inimigos.
- `src/core/EnemySprite.js`: carregamento de atlas, animação e renderização.
- `assets/sprites/enemies/`: spritesheets PNG e atlas JSON dos inimigos e do chefe.

## Estado atual

O operador possui movimentação e câmera follow. O primeiro protótipo de inimigo é o Brute, que surge na arena e persegue o jogador. Os outros inimigos e o chefe têm seus assets preparados para as próximas etapas. Combate, dano, colisão e ondas ainda serão implementados.

## Desenvolvimento

Commits em português, módulos com responsabilidades separadas e escopo incremental. O projeto não utiliza frameworks ou engines de jogos.
