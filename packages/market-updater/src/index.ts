import { createExtension, createTags, createUsers, fetchExtensions, getExtension } from "./fetch-extensions.js"
import type { ExtensionInfo } from "./types.js"
import 'dotenv/config'

const registry = process.env['REGISTRY'] ?? 'registry.npmjs.org'
const extensionNames = await fetchExtensions(registry)
const errors: Error[] = []

const extensions: ExtensionInfo[] = []

for (const name of extensionNames) {
	try {
		const extension = await getExtension(registry, name)
		extensions.push(extension)
	} catch (error: any) {
		errors.push(error)
	}
}

const emailIDMap = await createUsers(extensions)
await createTags(extensions)

for (const extension of extensions) {
	await createExtension(extension, registry, emailIDMap)
}

console.log(errors.map(error => error.message))

process.exit(0)
