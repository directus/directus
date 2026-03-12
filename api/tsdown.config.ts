import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts'],
	unbundle: true,
	tsconfig: 'tsconfig.prod.json',
	treeshake: false,
});
