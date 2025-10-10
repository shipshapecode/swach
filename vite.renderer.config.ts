import { classicEmberSupport, ember, extensions } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    classicEmberSupport(),
    ember(),
    tailwindcss(),
    // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],

  build: {
    rollupOptions: {
      // Use a function to determine what should be external - let Embroider handle Ember packages
      external: (id) => {
        // Let Embroider handle all Ember framework packages and addons
        return (
          id.startsWith('@ember/') ||
          id.startsWith('@glimmer/') ||
          id.startsWith('ember-') ||
          id.includes('decorator-transforms')
        );
      },
    },
  },
});
