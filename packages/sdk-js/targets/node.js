import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';

export default {
	input: 'src/node/index.ts',
	output: {
		file: './node/index.js',
		format: 'cjs',
		exports: 'auto',
		sourcemap: true,
	},
	plugins: [
		json(),
		resolve({
			preferBuiltins: true,
			browser: false,
		}),
		typescript({
			tsconfig: 'tsconfig.node.json',
			useTsconfigDeclarationDir: true,
		}),
		commonjs(),
		sourceMaps(),
	],
};
