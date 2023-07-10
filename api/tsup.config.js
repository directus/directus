import cpy from 'cpy';
import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts', 'src/cli/run.ts'],
	format: 'esm',
	async onSuccess() {
		await cpy(['src/**/*.{yaml,liquid}'], 'dist');
	},
	dts: 'src/index.ts',
});
