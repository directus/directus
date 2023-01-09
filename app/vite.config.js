import {
	APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES,
	APP_OR_HYBRID_EXTENSION_TYPES,
	APP_SHARED_DEPS,
	NESTED_EXTENSION_TYPES,
} from '@directus/shared/constants';
import {
	ensureExtensionDirs,
	generateExtensionsEntrypoint,
	getLocalExtensions,
	getPackageExtensions,
} from '@directus/shared/utils/node';
import yaml from '@rollup/plugin-yaml';
import vue from '@vitejs/plugin-vue';
import hljs from 'highlight.js';
import path from 'path';
import fs from 'fs';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItContainer from 'markdown-it-container';
import markdownItTableOfContents from 'markdown-it-table-of-contents';
import md from 'vite-plugin-vue-markdown';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

const API_PATH = path.join('..', 'api');
const EXTENSIONS_PATH = path.join(API_PATH, 'extensions');

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		directusExtensions(),
		vue({
			include: [/\.vue$/, /\.md$/],
		}),
		md({
			wrapperComponent: 'docs-wrapper',
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
				md.use(markdownItTableOfContents, { includeLevel: [2] });
				md.use(markdownItAnchor, {
					permalink: markdownItAnchor.permalink.linkInsideHeader({ placement: 'before' }),
				});

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

				md.use(markdownItContainer, 'tip', { render: hintRenderer('tip') });
				md.use(markdownItContainer, 'warning', { render: hintRenderer('warning') });
				md.use(markdownItContainer, 'danger', { render: hintRenderer('danger') });

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
	optimizeDeps: {
		exclude: ['@directus/docs'],
	},
	resolve: {
		alias: [
			{ find: '@', replacement: path.resolve(__dirname, 'src') },
			{ find: 'json2csv', replacement: 'json2csv/dist/json2csv.umd.js' },
		],
	},
	base: process.env.NODE_ENV === 'production' ? '' : '/admin/',
	server: {
		port: 8080,
		proxy: {
			'^/(?!admin)': {
				target: process.env.API_URL ? process.env.API_URL : 'http://127.0.0.1:8055/',
				changeOrigin: true,
			},
		},
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), ...getExtensionsRealPaths()],
		},
	},
	test: {
		environment: 'happy-dom',
		setupFiles: ['src/__setup__/mock-globals.ts'],
	},
});

function getExtensionsRealPaths() {
	return fs.existsSync(EXTENSIONS_PATH)
		? fs.readdirSync(EXTENSIONS_PATH).flatMap((typeDir) => {
				const extensionTypeDir = path.join(EXTENSIONS_PATH, typeDir);

				return fs.readdirSync(extensionTypeDir).map((dir) => fs.realpathSync(path.join(extensionTypeDir, dir)));
		  })
		: [];
}

function directusExtensions() {
	const virtualExtensionsId = '@directus-extensions';

	let extensionsEntrypoint = null;

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
				if (id === virtualExtensionsId) {
					return id;
				}
			},
			load(id) {
				if (id === virtualExtensionsId) {
					return extensionsEntrypoint;
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
						external: [virtualExtensionsId],
						preserveEntrySignatures: 'exports-only',
					},
				},
			}),
		},
	];

	async function loadExtensions() {
		await ensureExtensionDirs(EXTENSIONS_PATH, NESTED_EXTENSION_TYPES);
		const packageExtensions = await getPackageExtensions(API_PATH, APP_OR_HYBRID_EXTENSION_PACKAGE_TYPES);
		const localExtensions = await getLocalExtensions(EXTENSIONS_PATH, APP_OR_HYBRID_EXTENSION_TYPES);

		const extensions = [...packageExtensions, ...localExtensions];

		extensionsEntrypoint = generateExtensionsEntrypoint(extensions);
	}
}
