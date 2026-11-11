import { defineConfig } from 'tsdown';

export default defineConfig({
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
	fixedExtension: false,
	dts: false,
	tsconfig: 'tsconfig.prod.json',
});
