import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'node-screenshots',
        /node-screenshots-.*/, // Also externalize platform-specific binaries
      ],
    },
  },
});
