# Swach

![CI](https://github.com/shipshapecode/swach/workflows/CI/badge.svg)

Swach is a modern color palette manager.

<a href="https://swach.io/">
  <img width="1728" 
    alt="Swach homepage showing the app running." 
    src="https://user-images.githubusercontent.com/2640861/194164254-4504e8f3-497c-43b2-8eb9-4bcacd1a69c8.png"
  />
</a>

**[Swach is built and maintained by Ship Shape. Contact us for web and native app development services.](https://shipshape.io/)**

## Prerequisites

You will need the following things properly installed on your computer.

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Ember CLI](https://ember-cli.com/)
- [Google Chrome](https://google.com/chrome/)

## Installation

- `git clone <repository-url>` this repository
- `cd swach`
- `pnpm install`

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

- `pnpm lint`
- `pnpm lint:fix`

### Building / Packaging

- `ember electron:make`

## Releasing

- Bump the version with:

```bash
release-it
```

Choose the appropriate major, minor, patch, beta, etc version in the prompt.

GitHub actions should then take that new tag and build and release automatically.
