import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { searchForWorkspaceRoot } from 'vite';
import { set } from 'lodash-es'

export default defineConfig({
	server: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin',
		},
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd())],
		},
	},
	plugins: [
		directusFilesPlugin()
	],

});

function directusFilesPlugin() {
	const virtualExtensionsId = 'directus-files';

	let directusFiles = {}

	return [
		{
			name: 'directus-files-serve',
			apply: 'serve',
			async buildStart() {
				directusFiles = loadFiles();
			},
			resolveId(id) {
				if (id === virtualExtensionsId) {
					return id;
				}
			},
			load(id) {
				if (id === virtualExtensionsId) {
					return 'export const files = ' + JSON.stringify(directusFiles) + ';'
				}
			},
		},
		// {
		// 	name: 'directus-extensions-build',
		// 	apply: 'build',
		// 	config: () => ({
		// 		build: {
		// 			rollupOptions: {
		// 				input: {
		// 					index: path.resolve(__dirname, 'index.html'),
		// 					...APP_SHARED_DEPS.reduce((acc, dep) => ({ ...acc, [dep.replace(/\//g, '_')]: dep }), {}),
		// 				},
		// 				output: {
		// 					entryFileNames: 'assets/[name].[hash].entry.js',
		// 				},
		// 				external: [virtualExtensionsId],
		// 				preserveEntrySignatures: 'exports-only',
		// 			},
		// 		},
		// 	}),
		// },
	];
}

function loadFiles() {
	const files = {}

	const skip = [
		path.join('api', 'extensions'),
		path.join('node_modules'),
		path.join('.git'),
		path.join('.changeset'),
		path.join('.vscode'),
		path.join('.github')
	]

	loadFolder(path.join(searchForWorkspaceRoot(process.cwd()), 'api'), path.join('api'))
	loadFolder(path.join('directus'))

	function loadFolder(folder, prefix) {
		const relativeFolder = folder.substring(searchForWorkspaceRoot(process.cwd()).length)

		console.log(folder)

		for (const s of skip) {
			if (folder.substring(searchForWorkspaceRoot(process.cwd()).length).includes(path.join(s))) return
		}

		const fileUrls = fs.readdirSync(folder);

		for (const file of fileUrls) {
			if (fs.lstatSync(path.join(folder, file)).isDirectory()) {
				loadFolder(path.join(folder, file));
				continue;
			}

			const filePath = prefix ? path.join(prefix, file) : file;

			files[filePath] = {
				file: {
					contents: fs.readFileSync(path.join(folder, file), 'utf-8')
				}
			}
		}
	}

	return files;
}


