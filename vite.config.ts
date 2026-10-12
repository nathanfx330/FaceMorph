// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths let the same build run at / and at /FaceMorph/.
  base: './',
  build: {
    target: 'es2022',
  },
});
