import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { nodeExternals } from 'rollup-plugin-node-externals';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { writeFile } from 'node:fs/promises';

export default defineConfig({
	plugins: [
		{ ...nodeExternals(), enforce: 'pre' },
		vue(),
		dts(),
		{
			name: 'generate-json-schema',
			closeBundle: async () => {
				const { ThemeSchema } = await import('./dist/index.js');
				const jsonSchema = JSON.stringify(ThemeSchema, null, '\t');
				await writeFile('./schema.json', jsonSchema);
			},
		},
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			fileName: 'index',
			formats: ['es'],
		},
	},
});
