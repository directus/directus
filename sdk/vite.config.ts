import { systemCollectionNames } from '@directus/system-data';
import { defineConfig } from 'vite-plus';

const env = process.env.NODE_ENV;

export default defineConfig({
	pack: {
		sourcemap: env === 'production',
		dts: true,
		format: ['cjs', 'esm'],
		minify: env === 'production',
		watch: env === 'development',
		unbundle: true,
		target: 'es2022',
		entry: ['src/index.ts'],
		define: {
			__SYSTEM_COLLECTION_NAMES__: JSON.stringify(systemCollectionNames),
		},
	},
});
