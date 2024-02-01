import ViteYaml from '@modyfi/vite-plugin-yaml';
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts';
import { resolve } from 'path'

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			formats: ['es'],
      name: 'index',
      fileName: 'index',
		}
	},
  plugins: [
    ViteYaml(),
		dts(),
  ],
});
