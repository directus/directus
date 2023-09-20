import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { searchForWorkspaceRoot } from 'vite';
import { set } from 'lodash-es'

const workspaceRoot = searchForWorkspaceRoot(process.cwd())

export default defineConfig({
	server: {
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin',
		},
		fs: {
			allow: [workspaceRoot],
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

	loadFolder(path.join(workspaceRoot, 'api'), workspaceRoot)
	loadFolder(path.join('directus'), 'directus')

	function loadFolder(folder, replace = workspaceRoot, prefix = "") {

		console.log(folder)

		for (const s of skip) {
			if (folder.substring(workspaceRoot.length).includes(path.join(s))) return
		}

		const fileUrls = fs.readdirSync(folder);

		for (const file of fileUrls) {
			if (fs.lstatSync(path.join(folder, file)).isDirectory()) {
				loadFolder(path.join(folder, file), replace, prefix);
				continue;
			}

			path.join(folder, file)

			const filePath = urlToPath(path.join(prefix, path.join(folder, file).replace(replace, "")))

			console.log("file://", filePath.join('/'))

			if (file.endsWith('.db')) {
				set(files, filePath, {
					file: {
						contents: fs.readFileSync(path.join(folder, file))
					}
				})
			} else {
				set(files, filePath, {
					file: {
						contents: fs.readFileSync(path.join(folder, file), 'utf-8')
					}
				})
			}


		}

	}

	return files;
}

function urlToPath(url) {
	const parts = url.split(/[/\\]/g).filter(Boolean)

	return [...parts.slice(0, -1).map(p => [p, 'directory']).flat(), parts.at(-1)]
}
