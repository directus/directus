import { defineConfig } from 'vite-plus';
import Vue from 'unplugin-vue/rolldown';

export default defineConfig({
	pack: {
		entry: ['./src/index.ts'],
		platform: 'neutral',
		plugins: [Vue({ isProduction: true })],
		dts: false,
	},
});
