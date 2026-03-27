import { defineConfig } from 'vite-plus';
import yaml from 'unplugin-yaml/rolldown';

const env = process.env.NODE_ENV;

export default defineConfig({
	pack: {
		plugins: [yaml()],
		entry: ['src/index.ts'],
		format: ['cjs', 'esm'],
		target: 'es2020',
		minify: env === 'production',
		watch: env === 'development',
		dts: true,
	},
});
