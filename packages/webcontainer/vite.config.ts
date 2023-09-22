import { PluginOption, defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { searchForWorkspaceRoot } from 'vite';
import { set } from 'lodash-es'
import vue from '@vitejs/plugin-vue'

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
		vue(),
		directusFilesPlugin()
	],

});

function directusFilesPlugin(): PluginOption {
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

	loadFolder(path.join(workspaceRoot, 'api'), skip, workspaceRoot, undefined, mapArgon2)
	loadFolder(path.join('directus'), [], 'directus')


	function mapArgon2(contents, filePath) {
		if (filePath.at(-1).endsWith('.ts')) {
			contents = contents.replace(/import argon2 from 'argon2'/g, `import argon2 from '${"../".repeat((filePath.length - 1) / 2)}argon2.ts'`)

		} else if (filePath.at(-1).endsWith('.js')) {
			contents = contents.replace(/import argon2 from 'argon2'/g, `import argon2 from '${"../".repeat((filePath.length - 1) / 2)}argon2.mjs'`)
		}

		if (contents.includes("argon2")) console.log(contents)
		return contents
	}

	function loadFolder(folder: string, skip: string[], replace = workspaceRoot, prefix = "", mapfile: (contents: string, filePath: string[]) => string = (e) => e) {

		console.log(folder)

		for (const s of skip) {
			if (folder.substring(workspaceRoot.length).includes(path.join(s))) return
		}

		const fileUrls = fs.readdirSync(folder);

		for (const file of fileUrls) {
			if (fs.lstatSync(path.join(folder, file)).isDirectory()) {
				loadFolder(path.join(folder, file), skip, replace, prefix, mapfile);
				continue;
			}

			path.join(folder, file)

			const filePath = urlToPath(path.join(prefix, path.join(folder, file).replace(replace, "")))

			let contents = fs.readFileSync(path.join(folder, file), file.endsWith('.db') ? undefined : 'utf-8')

			contents = mapfile(contents, filePath)

			set(files, filePath, {
				file: {
					contents
				}
			})

		}

	}

	return files;
}

function urlToPath(url: string) {
	const parts = url.split(/[/\\]/g).filter(Boolean)

	return [...parts.slice(0, -1).map(p => [p, 'directory']).flat(), parts.at(-1)]
}
