import { batchPromise } from "./batch-promise.js"
import { createExtension } from "./create-extension.js"
import { createTags } from "./create-tags.js"
import { createUsers } from "./create-users.js"
import { fetchExtensions } from "./fetch-extensions.js"
import { getExtension } from "./fetch-extension.js"
import type { ExtensionInfo } from "./types.js"
import 'dotenv/config'
import fse from 'fs-extra'
import * as path from 'path'
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const registry = process.env['REGISTRY'] ?? 'registry.npmjs.org'
const CACHE = process.env['CACHE'] === 'true'
const CACHE_FOLDER = path.join(__dirname, '..', process.env['CACHE_FOLDER'] ?? 'cache')
const extensionNames = await fetchExtensions(registry)

const batch = Number(process.env['BATCH'] ?? 1)
const errorFile = path.join(__dirname, '..', process.env['ERROR_FILE'] ?? 'errors.txt')

if (!fse.existsSync(errorFile)) {
	fse.createFileSync(errorFile)
} else {
	fse.writeFileSync(errorFile, '')
}

let extensions: ExtensionInfo[] = []

const hasCache = await fse.pathExists(path.join(CACHE_FOLDER, 'extensions.json'))

if (hasCache && CACHE) {
	// eslint-disable-next-line no-console
	console.log('Using cache')

	extensions = await fse.readJSON(path.join(CACHE_FOLDER, 'extensions.json'))
} else {
	await batchPromise(extensionNames, batch, async (name) => {
		try {
			const extension = await getExtension(registry, name)
			extensions.push(extension)
		} catch (error: any) {
			process.stdout.write(` failed\n`)
			await fse.appendFile(errorFile, `${name}: ${error}\n\n`)
		}
	})

	if (CACHE) {
		await fse.mkdirs(CACHE_FOLDER)
		await fse.writeJSON(path.join(CACHE_FOLDER, 'extensions.json'), extensions)
	}

}

const emailIDMap = await createUsers(extensions)
await createTags(extensions)

await batchPromise(extensions, 1, async (extension) => {
	await createExtension(extension, registry, emailIDMap)
})
