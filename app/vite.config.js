import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import yaml from '@rollup/plugin-yaml';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		yaml({
			transform(data) {
				return data === null ? {} : undefined;
			},
		}),
		moduleRelativeResolve(),
	],
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

	return [
		{
			name: 'module-relative-resolve',
			apply: 'serve',
			transform(code, id) {
				if (code.indexOf('@vite-module!') !== -1) {
					return {
						code: code.replace(MODULE_REGEX, (_, module) => {
							return `./${path.relative(path.dirname(id), '.')}/@fs${path.dirname(
								require.resolve(`${module}/package.json`)
							)}`;
						}),
						map: null,
					};
				}

				return null;
			},
		},
		{
			name: 'module-relative-resolve',
			apply: 'build',
			transform(code, id) {
				if (code.indexOf('@vite-module!') !== -1) {
					return {
						code: code.replace(MODULE_REGEX, (_, module) => {
							return `./${path.relative(path.dirname(id), path.dirname(require.resolve(`${module}/package.json`)))}`;
						}),
						map: null,
					};
				}

				return null;
			},
		},
	];
}
