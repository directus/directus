import fetch from "node-fetch";
import { authentication, createDirectus, createItem, readItem, readItems, rest, updateItem } from '@directus/sdk';
import type { ExtensionOptions } from '@directus/types';
import type { Extension, ExtensionInfo, NPMDownloads, Permission, Schema, Version } from "./types.js";
import type { Packument, PackumentVersion } from '@npm/types'
import type { NPMSearchResponse } from "./npm-types.js";
import { Octokit } from "octokit";
import type { Endpoints } from '@octokit/types'
import 'dotenv/config'


console.log(process.env.DIRECTUS_URL)

const client = createDirectus<Schema>(process.env['DIRECTUS_URL']!).with(rest()).with(authentication())

await client.login(process.env['DIRECTUS_USER']!, process.env['DIRECTUS_PASSWORD']!)

const GH_TOKEN = process.env['GITHUB_TOKEN'] ?? ''

const octokit = new Octokit({ auth: GH_TOKEN })

export async function fetchExtensions(registry: string) {
	const extensions = new Set<string>();

	const size = 250;
	let from = 0;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const response = await fetch(`https://${registry}/-/v1/search?` + new URLSearchParams({
			text: "directus-extension",
			size: String(size),
			from: String(from)
		}))

		const json = await response.json() as NPMSearchResponse;

		for (const { package: pack } of json.objects) {
			extensions.add(pack.name);
		}

		if (json.objects.length < size) {
			break;
		}

		from = extensions.size;
	}

	console.log(`Found ${extensions.size} extensions.`)
	console.log(Array.from(extensions).join(', '))

	return Array.from(extensions);
}

function getExtensionOptions(version: PackumentVersion): ExtensionOptions {
	return (version as any)['directus:extension']
}

export async function getExtension(registry: string, name: string): Promise<ExtensionInfo> {
	console.log(`Fetching ${name}`)

	const response = await fetch(`https://${registry}/${name}`)
	const npmInfo = await response.json() as Packument;

	const ignoreVersions: string[] = []
	const latestVersion = npmInfo['dist-tags']?.latest

	if (latestVersion === undefined) throw new Error(`${name}: No latest Version noted.`)

	if (Object.keys(npmInfo.versions).length === 0) throw new Error(`${name}: At least 1 version has to be released.`)

	const ignoreVersion = (version: string, message: string) => {
		if (version === latestVersion) {
			throw new Error(`${name}#${version}: ${message}`)
		} else {
			ignoreVersions.push(version)
		}
	}

	for (const [version, pack] of Object.entries(npmInfo.versions)) {
		if (pack.name === undefined) ignoreVersion(version, `Name is missing.`)
		if (pack.version === undefined) ignoreVersion(version, `Version is missing.`)

		if (pack.author !== undefined) {
			if (typeof pack.author === 'string') ignoreVersion(version, `Author has to be an object.`)

			else if (pack.author.name === undefined) ignoreVersion(version, `Author name is missing.`)
			else if (pack.author.email === undefined) ignoreVersion(version, `Author email is missing.`)
		}

		if (pack.maintainers.length === 0 && pack.author === undefined) ignoreVersion(version, `At least 1 maintainer or author is required.`)

		for (const maintainer of pack.maintainers) {
			if (typeof maintainer === 'string') ignoreVersion(version, `Maintainer has to be an object.`)

			else if (maintainer.name === undefined) ignoreVersion(version, `Maintainer name is missing.`)
			else if (maintainer.email === undefined) ignoreVersion(version, `Maintainer email is missing.`)
		}

		const extensionOptions = getExtensionOptions(pack)

		if (extensionOptions === undefined) ignoreVersion(version, `Extension info is missing.`)
		if (extensionOptions?.type === undefined) ignoreVersion(version, `Extension type is missing.`)
		if (extensionOptions?.host === undefined) ignoreVersion(version, `Extension host is missing.`)

		if (!pack.repository || (typeof pack.repository === 'object' && pack.repository?.url === undefined)) ignoreVersion(version, `Repository url is missing.`)
	}

	let repository = npmInfo.versions[latestVersion]!.repository!


	repository = typeof repository === 'string' ? repository : repository.url!
	const githubName = (/^git\+https:\/\/github\.com\/(.*?)\.git$/.exec(repository) ?? [])[1]!

	const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
		owner: githubName.split('/')[0]!,
		repo: githubName.split('/')[1]!
	})

	const downloads = await fetchDownloads(registry, name)

	const readmes = await fetchVersions(Object.keys(npmInfo.versions), latestVersion, githubName)

	return {
		npm: npmInfo,
		github: data,
		downloads,
		ignoreVersions,
		latestVersion,
		readmes,
	}
}

export async function fetchVersions(versions: string[], latestVersion: string, githubName: string) {
	console.log(`Fetching readmes for ${githubName}: ${versions.join(', ')}`)

	const readmes: Record<string, string> = {}

	for (const version of versions) {
		const options: Endpoints['GET /repos/{owner}/{repo}/readme']['parameters'] = {
			owner: githubName.split('/')[0]!,
			repo: githubName.split('/')[1]!,
		}

		if (version !== latestVersion) options.ref = version

		const { data: { content } } = await octokit.request('GET /repos/{owner}/{repo}/readme', options)

		readmes[version] = content
	}

	return readmes
}

export async function fetchDownloads(registry: string, name: string) {
	console.log(`Fetching downloads for ${name}`)

	if (registry !== 'registry.npmjs.org') return []

	const response = await fetch(`https://api.npmjs.org/downloads/range/last-year/${name}`)
	const json = await response.json() as NPMDownloads;

	return json.downloads
}

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
		console.log(`Creating tag ${tag}`)

		const existingTag = await client.request(readItem('tags', tag))

		if (existingTag) {
			await client.request(updateItem('tags', tag, { tag }))
		} else {
			await client.request(createItem('tags', { tag }))
		}
	}
}

export async function createExtension(extensionInfo: ExtensionInfo, registry: string, emailIDMap: Record<string, string>) {
	console.log(`Creating extension ${extensionInfo.npm.name}`)

	const { npm, github, downloads, latestVersion, ignoreVersions, readmes } = extensionInfo

	const latestPack = npm.versions[latestVersion]!

	const versions: Version[] = []

	for (const [version, pack] of Object.entries(npm.versions)) {
		if (ignoreVersions.includes(version)) {
			continue
		}

		const extensionOptions = getExtensionOptions(pack)

		const mainType = extensionOptions.type

		const types = [mainType];

		if (mainType === 'bundle' && Array.isArray(extensionOptions.entries)) {
			for (const subType of extensionOptions.entries) {
				if (subType.type !== undefined) types.push(subType.type)
			}
		}

		const permissions: Permission[] = []

		for (const permission of extensionOptions.permissions ?? []) {
			if (!permission.permission) continue

			permissions.push({
				permission: permission.permission,
				optional: permission.optional ?? false,
				options: permission.options ?? {}
			})
		}

		const secure = extensionOptions.secure ?? false
		const content = Object.entries(readmes).find(([key]) => key === version)![1] ?? ''
		const buffer = Buffer.from(content, 'base64');
		const readme = buffer.toString('utf8');

		versions.push({
			version: `${pack.name}#${version}`,
			size: pack.dist?.unpackedSize ?? null,
			readme: readme ?? '',
			types: types.map(type => ({ "extension_types_type": type })),
			license: pack.license ?? '',
			directus_version: extensionOptions.host ?? null,
			secure,
			requested_permissions: permissions
		})

	}

	const downloadsMapped = []
	let downloads_last_year = 0
	let downloads_last_month = 0

	for (const download of downloads) {
		downloadsMapped.push({
			id: `${latestPack.name}#${download.day}`,
			date: download.day,
			downloads: download.downloads
		})

		const now = new Date()

		if (new Date(download.day) > new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365)) {
			downloads_last_year += download.downloads
		}

		if (new Date(download.day) > new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)) {
			downloads_last_month += download.downloads
		}
	}

	const extension: Partial<Extension> = {
		id: latestPack.name,
		description: latestPack.description ?? '',
		icon: (latestPack as any)['icon'],
		created: npm.time.created,
		updated: npm.time.modified,
		homepage: (latestPack as any)['homepage'],
		tags: (latestPack.keywords ?? []).map(keyword => ({ tags_tag: keyword })),
		author: emailIDMap[(latestPack.author as any)?.email]! ?? null,
		maintainers: latestPack.maintainers.map(maintainer => ({ users_email: emailIDMap[(maintainer as any).email]! })),
		versions: versions,
		downloads: downloadsMapped,
		stars: github.stargazers_count,
		downloads_last_year,
		downloads_last_month,
		registry
	}

	const existingExtension = await client.request(readItem('extensions', latestPack.name))

	if (existingExtension) {
		await client.request(updateItem('extensions', encodeURIComponent(latestPack.name), extension))
	} else {
		await client.request(createItem('extensions', extension))
	}

	await client.request(updateItem('extensions', encodeURIComponent(latestPack.name), { latest_version: `${latestPack.name}#${latestVersion}` }))

	// logo: package.logo || null, logo_title: package.name + "-logo"
}
