module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  plugins: [
    'ember'
  ],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended'
  ],
  env: {
    browser: true
  },
  globals: {
    requireNode: false
  },
  rules: {
    'ember/no-jquery': 'error',
    'require-yield': 'off'
  },
  overrides: [
    // node files
    {
      files: [
        '.ember-cli.js',
        '.eslintrc.js',
        '.prettierrc.js',
        '.template-lintrc.js',
        'ember-cli-build.js',
        'tailwind.config.js',
        'testem.js',
        'blueprints/*/index.js',
        'config/**/*.js',
        'electron-app/**/*.js',
        'lib/*/index.js',
        'server/**/*.js'
      ],
      parserOptions: {
        sourceType: 'script'
      },
      env: {
        browser: false,
        node: true
      },
      globals: {
        document: false
      },
      plugins: ['node'],
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        // add your custom rules and overrides for node files here

        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'no-console': 'off',
        'node/no-unpublished-require': 'off',
        'node/no-extraneous-require': ['error', {
          'allowModules': [
            'ember-electron',
            'electron'
          ]
        }],
        'node/no-missing-require': ['error', {
          'allowModules': [
            'electron',
            'menubar',
            'osx-mouse',
            'robotjs',
            'win-mouse'
          ]
        }]
      })
    }
  ]
};
