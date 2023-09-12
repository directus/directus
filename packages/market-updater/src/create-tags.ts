import { createItem, readItem, updateItem } from "@directus/sdk"
import type { ExtensionInfo } from "./types.js"
import { client } from "./directus-sdk.js"

export async function createTags(extensions: ExtensionInfo[]) {
	const tags = new Set<string>()

	for (const extension of extensions) {
		if (extension['npm'] === undefined || extension['latestVersion'] === undefined) continue

		const { latestVersion, npm } = extension

		const keywords = npm.versions[latestVersion]!.keywords ?? []

		for (const keyword of keywords) {
			tags.add(keyword)
		}
	}

	for (const tag of Array.from(tags)) {
		// eslint-disable-next-line no-console
		console.log(`Creating tag ${tag}`)

		const existingTag = await client.request(readItem('tags', tag))

		if (existingTag) {
			await client.request(updateItem('tags', tag, { tag }))
		} else {
			await client.request(createItem('tags', { tag }))
		}
	}
}
