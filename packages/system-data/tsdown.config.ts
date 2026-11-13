import { defineConfig } from 'tsdown';
import yaml from 'unplugin-yaml/rolldown';
import { baseConfig } from '../../tsdown.config.ts';

const env = process.env.NODE_ENV;

export default defineConfig({
	...baseConfig,
	plugins: [yaml()],
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	target: 'es2020',
	minify: env === 'production',
	watch: env === 'development',
	dts: true,
});
