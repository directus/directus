import { defineConfig } from 'tsdown';

const env = process.env.NODE_ENV;

export default defineConfig(() => ({
	sourcemap: env === 'production', // source map is only available in prod
	clean: true, // clean dist before build
	dts: true, // generate dts file for main module
	globalName: 'DirectusVisualEditing', // global variable name for iife
	minify: env === 'production',
	watch: env === 'development',
	target: 'es2022',
	fixedExtension: false, // use .js/.cjs based on package type
	entry: ['src/index.ts'],
	format: {
		cjs: {},
		esm: {},
		iife: {
			entry: { 'visual-editing': 'src/index.ts' },
		},
	},
	outputOptions(options, format) {
		if (format === 'iife') {
			options.entryFileNames = '[name].js';
			options.globals = { '@reach/observe-rect': 'observeRect' };
		}

		return options;
	},
}));
