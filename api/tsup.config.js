import { mkdist } from 'mkdist';
import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/cli/run.ts'],
	format: 'esm',
	async onSuccess() {
		await mkdist({
			pattern: ['**/*.{yaml,liquid}', 'database/migrations/!(run).ts'],
			ext: 'js',
			cleanDist: false,
		});
	},
	dts: 'src/index.ts',
});
