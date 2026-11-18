import { defineConfig } from 'tsdown';
import Vue from 'unplugin-vue/rolldown';
import { baseConfig } from '../../tsdown.config.ts';

export default defineConfig({
	...baseConfig,
	entry: ['./src/index.ts'],
	platform: 'neutral',
	plugins: [Vue({ isProduction: true })],
	dts: { vue: true },
});
