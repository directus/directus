import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
	entry: {
		sdk: 'src/index.ts',
	},
	format: ['esm', 'cjs', 'iife'],
	bundle: true,
	dts: 'src/index.ts',
	clean: true,
	minify: !options.watch,
	outExtension({ format }) {
		let name = `.${format}.js`;

		switch (format) {
			case 'esm':
				name = `.esm.min.js`;
				break;
			case 'cjs':
				name = `.cjs.js`;
				break;
			case 'iife':
				name = `.bundler.js`;
				break;
		}

		return {
			js: name,
		};
	},
}));
