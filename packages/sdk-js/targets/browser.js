import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';

function target(format) {
	const config = {
		input: 'src/browser/index.ts',
		output: {
			name: 'Directus',
			file: `./browser/${format}.js`,
			format,
			exports: 'auto',
			sourcemap: true,
			globals: ['axios'],
		},
		plugins: [
			json(),
			resolve({
				browser: true,
			}),
			typescript({
				tsconfig: 'tsconfig.browser.json',
			}),
			commonjs(),
			sourceMaps(),
			terser({
				ecma: 2015,
			}),
		],
	};
	return [
		config,
		{
			...config,
			output: {
				...config.output,
				file: config.output.file.replace(/\.js$/, '.min.js'),
			},
		},
	];
}

export default [
	// Browser targets
	...target('umd'),
	...target('esm'),
	//...target('iife'),
	...target('system'),
];
