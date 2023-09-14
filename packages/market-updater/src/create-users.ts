import { createItem, readItems, updateItem } from "@directus/sdk"
import { client } from "./directus-sdk.js"
import type { ExtensionInfo } from "./types.js"
import { batchPromise } from "./batch-promise.js"

export async function createUsers(extensions: ExtensionInfo[]) {

	const users: Record<string, any> = {}

	const emailIDMap: Record<string, string> = {}

	for (const extension of extensions) {
		const { latestVersion, versions } = extension

		const author = versions[latestVersion]?.author
		const maintainers = versions[latestVersion]?.maintainers ?? []

		if (author) users[author.email!] = author

		for (const maintainer of maintainers) {
			users[maintainer.email!] = maintainer
		}
	}

	await batchPromise(Object.values(users), 2, async (user) => {

		const existingUser = await client.request(readItems('users', { filter: { email: { _eq: user.email } }, fields: ['*'] }))

		if (existingUser && existingUser.length > 0) {
			// eslint-disable-next-line no-console
			console.log(`Update user ${user.email}`)
			await client.request(updateItem('users', existingUser[0]!.id, user))

			emailIDMap[user.email] = existingUser[0]!.id
		} else {
			// eslint-disable-next-line no-console
			console.log(`Creating user ${user.email}`)
			const resultingUser = await client.request(createItem('users', user))

			emailIDMap[resultingUser.email] = resultingUser.id
		}
	})

	return emailIDMap
}
