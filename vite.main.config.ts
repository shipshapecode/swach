import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const {
    forgeConfigSelf: { entry },
  } = env as unknown as { forgeConfigSelf: { entry: string } };

  return {
    build: {
      lib: {
        entry,
        fileName: () => '[name].js',
        formats: ['es'],
      },
      sourcemap: true,
    },
  };
});
