import { defineConfig, searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import md from 'vite-plugin-md';
import yaml from '@rollup/plugin-yaml';
import path from 'path';
import {
	ensureExtensionDirs,
	getPackageExtensions,
	getLocalExtensions,
	generateExtensionsEntry,
} from '@directus/shared/utils/node';
import { APP_SHARED_DEPS, APP_EXTENSION_TYPES, APP_EXTENSION_PACKAGE_TYPES } from '@directus/shared/constants';
import hljs from 'highlight.js';
import hljsGraphQL from './src/utils/hljs-graphql';

hljs.registerLanguage('graphql', hljsGraphQL);

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		directusExtensions(),
		vue({
			include: [/\.vue$/, /\.md$/],
		}),
		md({
			wrapperComponent: 'DocsWrapper',
			markdownItOptions: {
				highlight(str, lang) {
					if (lang && hljs.getLanguage(lang)) {
						try {
							return hljs.highlight(str, { language: lang }).value;
						} catch (err) {
							// eslint-disable-next-line no-console
							console.warn('There was an error highlighting in Markdown');
							// eslint-disable-next-line no-console
							console.error(err);
						}
					}

					return '';
				},
			},
			markdownItSetup(md) {
				md.use(require('markdown-it-table-of-contents'), { includeLevel: [2] });
				md.use(require('markdown-it-anchor'), { permalink: true, permalinkSymbol: '#' });

				function hintRenderer(type) {
					return (tokens, idx) => {
						const token = tokens[idx];
						let title = token.info.trim().slice(type.length).trim() || '';

						if (title) title = `<div class="hint-title">${title}</div>`;

						if (token.nesting === 1) {
							return `<div class="${type} hint">${title}\n`;
						} else {
							return '</div>\n';
						}
					};
				}

				md.use(require('markdown-it-container'), 'tip', { render: hintRenderer('tip') });
				md.use(require('markdown-it-container'), 'warning', { render: hintRenderer('warning') });
				md.use(require('markdown-it-container'), 'danger', { render: hintRenderer('danger') });

				md.core.ruler.push('router-link', (state) => {
					state.tokens.forEach((token) => {
						if (token.type === 'inline') {
							const inlineTokens = token.children;

							let isTraversingLink = false;
							for (let i = 0; i < inlineTokens.length; i++) {
								if (isTraversingLink && inlineTokens[i].type === 'link_close') {
									inlineTokens[i].tag = 'router-link';

									isTraversingLink = false;
								} else if (inlineTokens[i].type === 'link_open') {
									const href = inlineTokens[i].attrs.find((attr) => attr[0] === 'href');

									if (href) {
										if (href[1].startsWith('http')) {
											inlineTokens[i].attrs.push(['target', '_blank']);
											inlineTokens[i].attrs.push(['rel', 'noopener noreferrer']);
										} else if (!href[1].startsWith('#')) {
											inlineTokens[i].tag = 'router-link';
											inlineTokens[i].attrs = [['to', `/docs${href[1]}`]];

											isTraversingLink = true;
										}
									}
								}
							}
						}
					});
				});
			},
			transforms: {
				before(code) {
					const titleRegex = /^# ([^\n]+?)( <small><\/small>)?\n/m;

					const titleLine = code.match(titleRegex);

					const title = titleLine?.[1] ?? null;
					const modularExtension = Boolean(titleLine?.[2]);
					const codeWithoutTitle = code.replace(titleRegex, '');

					const newCode = `---\ntitle: "${title}"\nmodularExtension: ${modularExtension}${
						code.startsWith('---\n') ? codeWithoutTitle.substring(3) : `\n---\n\n${codeWithoutTitle}`
					}`;

					return newCode;
				},
			},
		}),
		yaml({
			transform(data) {
				return data === null ? {} : undefined;
			},
		}),
	],
	resolve: {
		alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
	},
	base: process.env.NODE_ENV === 'production' ? '' : '/admin/',
	server: {
		port: 8080,
		proxy: {
			'^/(?!admin)': {
				target: process.env.API_URL ? process.env.API_URL : 'http://localhost:8055/',
				changeOrigin: true,
			},
		},
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), '/admin/'],
		},
	},
});

function directusExtensions() {
	const prefix = '@directus-extensions-';
	const virtualIds = APP_EXTENSION_TYPES.map((type) => `${prefix}${type}`);

	let extensionEntrys = {};

	return [
		{
			name: 'directus-extensions-serve',
			apply: 'serve',
			config: () => ({
				optimizeDeps: {
					include: APP_SHARED_DEPS,
				},
			}),
			async buildStart() {
				await loadExtensions();
			},
			resolveId(id) {
				if (virtualIds.includes(id)) {
					return id;
				}
			},
			load(id) {
				if (virtualIds.includes(id)) {
					const extensionType = id.substring(prefix.length);

					return extensionEntrys[extensionType];
				}
			},
		},
		{
			name: 'directus-extensions-build',
			apply: 'build',
			config: () => ({
				build: {
					rollupOptions: {
						input: {
							index: path.resolve(__dirname, 'index.html'),
							...APP_SHARED_DEPS.reduce((acc, dep) => ({ ...acc, [dep.replace(/\//g, '_')]: dep }), {}),
						},
						output: {
							entryFileNames: 'assets/[name].[hash].entry.js',
						},
						external: virtualIds,
						preserveEntrySignatures: 'exports-only',
					},
				},
			}),
		},
	];

	async function loadExtensions() {
		const apiPath = path.join('..', 'api');
		const extensionsPath = path.join(apiPath, 'extensions');

		await ensureExtensionDirs(extensionsPath, APP_EXTENSION_TYPES);
		const packageExtensions = await getPackageExtensions(apiPath, APP_EXTENSION_PACKAGE_TYPES);
		const localExtensions = await getLocalExtensions(extensionsPath, APP_EXTENSION_TYPES);

		const extensions = [...packageExtensions, ...localExtensions];

		for (const extensionType of APP_EXTENSION_TYPES) {
			extensionEntrys[extensionType] = generateExtensionsEntry(extensionType, extensions);
		}
	}
}
