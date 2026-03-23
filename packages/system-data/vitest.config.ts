import yaml from 'unplugin-yaml/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [yaml() as any],
	test: {
		globals: false,
	},
});
