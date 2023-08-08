import { defineConfig } from 'tsup';

const env = process.env.NODE_ENV;

export default defineConfig(() => ({
	sourcemap: env === 'production', // source map is only available in prod
	clean: true, // clean dist before build
	dts: true, // generate dts file for main module
	format: ['cjs', 'esm'], // generate cjs and esm files
	minify: env === 'production',
	bundle: env === 'production',
	watch: env === 'development',
	target: 'es2020',
	entry: [
		'src/index.ts',
		// composables
		'src/auth/index.ts',
		'src/graphql/index.ts',
		'src/realtime/index.ts',
		'src/rest/index.ts',
	],
}));
