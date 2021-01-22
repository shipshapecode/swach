# Swach

![CI](https://github.com/shipshapecode/swach/workflows/CI/badge.svg)

Swach is a modern color palette manager.

## Prerequisites

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [Yarn](https://yarnpkg.com/)
- [Ember CLI](https://ember-cli.com/)
- [Google Chrome](https://google.com/chrome/)
- [Volta](https://docs.volta.sh/guide/)

## Installation

- `git clone <repository-url>` this repository
- `cd swach`
- `yarn install`

## Running / Development

### Electron

- `ember electron`

### Ember

- `ember serve`
- Visit your app at [http://localhost:4200](http://localhost:4200).
- Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Running Tests

- `ember test`
- `ember test --server`

### Linting

- `yarn lint:hbs`
- `yarn lint:js`
- `yarn lint:js --fix`

### Building / Packaging

- `ember electron:make`

## Releasing

- Bump the version with:

```bash
release-it
```

Choose the appropriate major, minor, patch, beta, etc version in the prompt.

GitHub actions should then take that new tag and build and release automatically.
