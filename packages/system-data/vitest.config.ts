import { defineConfig } from 'vitest/config';
import yaml from 'unplugin-yaml/vite';

export default defineConfig({
	plugins: [yaml() as any],
	test: {
		globals: false,
	},
});
