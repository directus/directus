/* eslint-disable no-console */

import ora from 'ora';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import vue from 'rollup-plugin-vue';
import { SHARED_DEPS } from '@directus/shared/constants';

export default async function build(options: { input: string; output: string }): Promise<void> {
	const spinner = ora('Building Directus extension...').start();

	const bundle = await rollup({
		input: options.input,
		external: SHARED_DEPS,
		plugins: [vue(), nodeResolve(), commonjs(), terser()],
	});

	await bundle.write({
		format: 'es',
		file: options.output,
	});

	await bundle.close();

	spinner.succeed('Done');
}
