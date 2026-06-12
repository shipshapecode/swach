import { classicEmberSupport, ember, extensions } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import svgJar from '@svg-jar/plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import viteTestemElectron from 'vite-plugin-testem-electron';

export default defineConfig({
  plugins: [
    classicEmberSupport(),
    ember(),
    svgJar({ target: 'ember' }),
    tailwindcss(),
    viteTestemElectron(),
    // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
  resolve: {
    preserveSymlinks: false,
  },
});
