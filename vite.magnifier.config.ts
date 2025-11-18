import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  root: './magnifier-renderer',
  plugins: [tailwindcss()],
  clearScreen: false,
});
