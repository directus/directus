import { createItem, readItems, updateItem } from "@directus/sdk"
import { client } from "./directus-sdk.js"
import type { ExtensionInfo } from "./types.js"
import { batchPromise } from "./batch-promise.js"
import { octokit } from "./octokit.js"
import { fetchFile } from "./fetch-file.js"

export async function createUsers(extensions: ExtensionInfo[]) {

	const users: Record<string, {
		email: string
		name: string
		url?: string
		readme?: string
		avatar?: string
	}> = {}

	const emailIDMap: Record<string, string> = {}

	for (const extension of extensions) {
		const { latestVersion, versions } = extension

		const author = versions[latestVersion]?.author
		const maintainers = versions[latestVersion]?.maintainers ?? []

		if (author) users[author.email!] = (author as any)

		for (const maintainer of maintainers) {
			users[maintainer.email!] = (maintainer as any)
		}
	}

	process.stdout.write(`Checking ${Object.keys(users).length} users\n`)

	await batchPromise(Object.values(users), 1, async (user) => {
		process.stdout.write(`\t${user.email}`)


		const existingGHUser = await octokit.request('GET /search/users', {
			q: user.email
		})

		if (existingGHUser.data.total_count > 0) {
			process.stdout.write(` github`)
			const name = existingGHUser.data.items[0]!.login

			let readmeContent = ''

			try {
				const readme = await octokit.request('GET /repos/{owner}/{repo}/readme', {
					owner: name,
					repo: name
				})

				process.stdout.write(` readme`)

				const base64 = readme.data.content
				const buffer = Buffer.from(base64, 'base64');
				readmeContent = buffer.toString('utf8');
			} catch (error) {
				readmeContent = existingGHUser.data.items[0]!.bio ?? ''
			}

			const avatarId = await fetchFile(`${user.email}.png`, existingGHUser.data.items[0]!.avatar_url)

			user = {
				...user,
				avatar: avatarId,
				readme: readmeContent
			}
		}

		const existingUser = await client.request(readItems('users', { filter: { email: { _eq: user.email } }, fields: ['*'] }))

		if (existingUser && existingUser.length > 0) {
			process.stdout.write(` updated\n`)
			await client.request(updateItem('users', existingUser[0]!.id, user))

			emailIDMap[user.email] = existingUser[0]!.id
		} else {
			process.stdout.write(` created\n`)
			const resultingUser = await client.request(createItem('users', user))

			emailIDMap[resultingUser.email] = resultingUser.id
		}
	})

	return emailIDMap
}
