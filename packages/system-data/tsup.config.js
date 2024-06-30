import { defineConfig } from 'tsup';
import { YAMLPlugin } from 'esbuild-yaml';

const env = process.env.NODE_ENV;

export default defineConfig({
	esbuildPlugins: [YAMLPlugin()],
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	target: 'es2020',
	minify: env === 'production',
	watch: env === 'development',
	clean: true,
	dts: true,
});
