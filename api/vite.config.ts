import { defineConfig } from 'vite-plus';

export default defineConfig({
	pack: {
		entry: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'],
		unbundle: true,
		tsconfig: 'tsconfig.prod.json',
		treeshake: false,
	},
});
