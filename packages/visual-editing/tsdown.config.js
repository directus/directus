import { defineConfig } from 'tsdown';

const env = process.env.NODE_ENV;

const shared = {
	sourcemap: env === 'production', // source map is only available in prod
	clean: true, // clean dist before build
	globalName: 'DirectusVisualEditing', // global variable name for iife
	minify: env === 'production',
	watch: env === 'development',
	target: 'es2022',
	noExternal: ['@directus/utils'], // inline so consumers don't pull the full utils dep tree
};

export default defineConfig(() => [
	{
		...shared,
		dts: true, // generate dts file for main module
		fixedExtension: false, // use .js/.cjs based on package type
		entry: ['src/index.ts', 'src/types.ts'],
		format: ['esm', 'cjs'],
	},
	{
		...shared,
		clean: false, // avoid wiping the esm/cjs output from the first config
		entry: { 'visual-editing': 'src/index.ts' },
		format: 'iife',
		outputOptions(options) {
			options.entryFileNames = '[name].js';
			options.globals = { '@reach/observe-rect': 'observeRect' };
			return options;
		},
	},
]);
