import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

import pkg from './package.json';

const globalName = 'DirectusSdk';

const configs = {
	global: {
		file: pkg.unpkg.replace('esm', 'global'),
		format: 'iife',
		target: 'es5',
		browser: true,
	},
	browser: {
		file: pkg.unpkg,
		format: 'es',
		browser: true,
		external: false,
	},
	bundler: {
		file: pkg.module,
		format: 'es',
		dev: true,
	},
	cjs: {
		file: pkg.main,
		format: 'cjs',
		dev: true,
	},
};

function createConfig({
	file,
	format,
	target = null,
	dev = false,
	browser = false,
	external = Object.fromEntries(Object.keys(pkg.dependencies || {}).map((x) => [x, x])),
}) {
	const config = {
		input: 'src/index.ts',
		output: {
			file,
			format,
			exports: 'auto',
			sourcemap: true,
		},
		external: external ? Object.keys(external) : undefined,
		watch: {
			include: 'src/**/*',
		},
		plugins: [
			json(),
			typescript({
				tsconfigOverride: {
					compilerOptions: {
						...(target ? { target, lib: [target] } : {}),
						declaration: false,
						declarationMap: false,
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
		config.output.globals = external ?? {};
	}

	if (!dev) {
		config.plugins.push(
			terser({
				ecma: target?.replace('es', '') ?? '2019',
			})
		);
	}

	return config;
}

function createConfigs(configs) {
	const typesConfig = {
		input: 'src/index.ts',
		output: [{ file: pkg.types, format: 'es' }],
		plugins: [dts()],
	};

	return [...Object.keys(configs).map((key) => createConfig(configs[key])), typesConfig];
}

export default createConfigs(configs);
