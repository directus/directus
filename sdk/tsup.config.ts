import type { Options } from 'tsup';

const env = process.env.NODE_ENV;

export const tsup: Options = {
	splitting: true,
	sourcemap: env === 'production', // source map is only available in prod
	clean: true, // rimraf disr
	dts: true, // generate dts file for main module
	format: ['cjs', 'esm'], // generate cjs and esm files
	minify: env === 'production',
	bundle: env === 'production',
	skipNodeModulesBundle: true,
	entryPoints: ['src/index.ts'],
	watch: env === 'development',
	target: 'es2020',
	outDir: 'dist',
	entry: [
		'src/index.ts',
		// composables
		'src/auth/index.ts',
		'src/graphql/index.ts',
		'src/realtime/index.ts',
		'src/rest/index.ts',
		// commands
		'src/rest/commands/index.ts',
		'src/realtime/commands/index.ts',
	],
};
