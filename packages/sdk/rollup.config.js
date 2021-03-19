import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';

function target(format) {
	const config = {
		input: 'src/index.ts',
		output: {
			name: 'Directus',
			file: `./dist/sdk.${format}.js`,
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
				tsconfig: 'tsconfig.json',
				tsconfigOverride: {
					compilerOptions: {
						module: 'ES2015',
					},
				},
			}),
			commonjs(),
			sourceMaps(),
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
			plugins: [
				...config.plugins,
				terser({
					ecma: 2015,
				}),
			],
		},
	];
}

export default [
	// Browser targets
	...target('iife'),
	...target('umd'),
	...target('esm'),
	...target('system'),
];
