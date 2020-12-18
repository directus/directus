import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

const globalName = 'DirectusSDK';

const configs = {
	global: {
		file: pkg.unpkg,
		format: 'iife',
		target: 'es5',
		mode: 'production',
		browser: true,
	},
	browser: {
		file: pkg.module.replace('bundler', 'esm'),
		format: 'es',
		target: 'es2018',
		mode: 'production',
		browser: true,
		external: {},
	},
	bundler: {
		file: pkg.module,
		format: 'es',
		target: 'es2015',
		mode: 'development',
	},
	cjs: {
		file: pkg.main,
		format: 'cjs',
		target: 'esnext',
		mode: 'development',
	},
};

function createConfig({
	file,
	format,
	target,
	mode,
	browser = false,
	external = Object.fromEntries(Object.keys(pkg.dependencies || {}).map((x) => [x, x])),
}) {
	const isProduction = mode === 'production';

	const config = {
		input: 'src/index.ts',
		output: {
			file: isProduction && !file.endsWith('.min.js') ? file.replace('.js', '.min.js') : file,
			format,
			exports: 'auto',
			sourcemap: true,
		},
		external: Object.keys(external),
		watch: {
			include: 'src/**/*',
		},
		plugins: [
			json(),
			typescript({
				useTsconfigDeclarationDir: true,
				tsconfigOverride: {
					compilerOptions: {
						target,
						lib: [target],
					},
				},
			}),
			resolve({ browser }),
			commonjs(),
			sourceMaps(),
		],
	};

	if (format === 'iife') {
		config.output.name = globalName;
		config.output.globals = external;
	}

	if (isProduction) {
		config.plugins.push(
			terser({
				ecma: target.replace('es', ''),
			})
		);
	}

	return config;
}

function createConfigs(configs) {
	return Object.keys(configs).map((key) => createConfig(configs[key]));
}

export default createConfigs(configs);
