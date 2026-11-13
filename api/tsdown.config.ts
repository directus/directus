import { defineConfig } from 'tsdown';
import { baseConfig } from '../tsdown.config.ts';

export default defineConfig({
	...baseConfig,
	entry: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/*.test.ts',
		'!src/__utils__',
		'!src/__setup__',
		'!src/test-utils',
		'!src/database/run-ast/lib/apply-query/mock.ts',
	],
	unbundle: true,
	dts: false,
	tsconfig: 'tsconfig.prod.json',
});
