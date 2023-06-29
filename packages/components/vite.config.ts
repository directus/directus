import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { nodeExternals } from 'rollup-plugin-node-externals';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	plugins: [{ ...nodeExternals(), enforce: 'pre' }, vue(), dts()],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			fileName: 'index',
			formats: ['es'],
		},
	},
});
