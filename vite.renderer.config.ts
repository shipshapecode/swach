import { classicEmberSupport, ember, extensions } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import postcssImport from 'postcss-import';
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        postcssImport({
          path: ['app/styles'],
        }),
      ],
    },
  },
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
});
