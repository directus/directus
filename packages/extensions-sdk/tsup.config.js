import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/cli/index.ts', 'src/cli/run.ts'],
	format: 'esm',
	dts: {
		entry: {
			index: 'src/index.ts',
			'cli/index': 'src/cli/index.ts',
		},
	},
});
