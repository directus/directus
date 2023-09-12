import { createExtension } from "./create-extension.js"
import { createTags } from "./create-tags.js"
import { createUsers } from "./create-users.js"
import { fetchExtensions } from "./fetch-extensions.js"
import { getExtension } from "./get-extension.js"
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

// eslint-disable-next-line no-console
console.log(errors.map(error => error.message))

process.exit(0)
