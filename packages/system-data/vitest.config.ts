import yaml from 'unplugin-yaml/vite';
import { defineConfig } from 'vite-plus';

export default defineConfig({
	plugins: [yaml() as any],
	test: {
		globals: false,
	},
});
