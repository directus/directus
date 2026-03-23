import { systemCollectionNames } from '@directus/system-data';
import { defineConfig } from 'tsdown';

const env = process.env.NODE_ENV;

export default defineConfig({
	sourcemap: env === 'production', // source map is only available in prod
	dts: true, // generate dts file for main module
	format: ['cjs', 'esm'], // generate cjs and esm files
	minify: env === 'production',
	watch: env === 'development',
	unbundle: true,
	target: 'es2022',
	entry: ['src/index.ts'],
	define: {
		__SYSTEM_COLLECTION_NAMES__: JSON.stringify(systemCollectionNames),
	},
});
