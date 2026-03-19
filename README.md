# Trello-like board

[![CI/CD](https://github.com/ValeriaZevs/DnD_management/actions/workflows/deploy.yml/badge.svg)](https://github.com/ValeriaZevs/DnD_management/actions)

## Demo

Мой проект доступен на **[GitHub Pages](https://ValeriaZevs.github.io/DnD_management/)**

## Описание

Учебный проект в стиле Trello:
- 3 фиксированные колонки;
- добавление карточек;
- удаление карточек по клику на крестик (появляется при hover);
- drag-and-drop карточек внутри колонки и между колонками с точным позиционированием курсора;
- сохранение состояния доски в LocalStorage;
- полная сборка проекта через Webpack.

## Скрипты

- `yarn start` — запуск dev-сервера (локальная разработка);
- `yarn build` — production-сборка готового проекта;
- `yarn lint` — проверка качества кода через ESLint;
- `yarn test` — запуск автотестов Jest.

## Технологии

- JavaScript (ES6+)
- Webpack
- Babel
- ESLint
- Jest
- GitHub Actions + GitHub Pages
