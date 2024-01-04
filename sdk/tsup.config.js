import { defineConfig } from 'tsup';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { version } = JSON.parse(await readFile(join(__dirname, '../directus/package.json'), 'utf8'));

const env = process.env.NODE_ENV;

export default defineConfig(() => ({
	sourcemap: env === 'production', // source map is only available in prod
	esbuildOptions(options) {
		// fetch source from GitHub
		options.sourceRoot = `https://raw.githubusercontent.com/directus/directus/v${version}/sdk/dist/`;
		options.sourcesContent = false;
	},
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
