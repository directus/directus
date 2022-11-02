import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		alias: [
			// TODO: Remove this after moving to ESM
			{
				find: '@directus/format-title',
				replacement: path.resolve(__dirname, '../app/node_modules/@directus/format-title'),
			},
		],
	},
});
