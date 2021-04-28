import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), yaml(), moduleRelativeResolve()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '/src'),
		},
	},
	base: '/admin/',
	server: {
		port: 8080,
		proxy: {
			'^/(?!admin)': {
				target: process.env.API_URL ? process.env.API_URL : 'http://localhost:8055/',
				changeOrigin: true,
			},
		},
	},
});

// @TODO3 This is a little bit of a hack to allow dynamic bare module imports with variables. Ideally vite would support this natively or we wouldn't rely on it.
function moduleRelativeResolve() {
	const MODULE_REGEX = /@vite-module!(@[^/]+\/[^/]+|[^@/]+)/g;

	return {
		name: 'module-relative-resolve',
		transform(source) {
			if (source.indexOf('@vite-module!') !== -1) {
				return source.replace(MODULE_REGEX, (_, module) => `./${path.relative('.', require.resolve(module))}`);
			}

			return null;
		},
	};
}
