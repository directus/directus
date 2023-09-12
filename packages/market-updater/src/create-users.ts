import { createItem, readItems, updateItem } from "@directus/sdk"
import { client } from "./directus-sdk.js"
import type { ExtensionInfo } from "./types.js"

export async function createUsers(extensions: ExtensionInfo[]) {

	const users: Record<string, any> = {}

	const emailIDMap: Record<string, string> = {}

	for (const extension of extensions) {
		if (extension['npm'] === undefined || extension['latestVersion'] === undefined) continue

		const { latestVersion, npm } = extension

		const author = npm.versions[latestVersion]?.author
		const maintainers = npm.versions[latestVersion]?.maintainers ?? []

		if (typeof author === 'string') continue

		if (author) users[author.email!] = author

		for (const maintainer of maintainers) {
			if (typeof maintainer === 'string') continue

			users[maintainer.email!] = maintainer
		}
	}

	for (const user of Object.values(users)) {
		// eslint-disable-next-line no-console
		console.log(`Creating user ${user.email}`)

		const existingUser = await client.request(readItems('users', { filter: { email: { _eq: user.email } }, fields: ['*'] }))

		if (existingUser && existingUser.length > 0) {
			await client.request(updateItem('users', existingUser[0]!.id, user))

			emailIDMap[user.email] = existingUser[0]!.id
		} else {
			const resultingUser = await client.request(createItem('users', user))

			emailIDMap[resultingUser.email] = resultingUser.id
		}
	}

	return emailIDMap
}
