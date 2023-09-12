import { createItem, readItems, updateItem } from "@directus/sdk"
import { getExtensionOptions } from "./get-extension.js"
import type { Extension, ExtensionInfo, Permission, Version } from "./types.js"
import { client } from "./directus-sdk.js"

export async function createExtension(extensionInfo: ExtensionInfo, registry: string, emailIDMap: Record<string, string>) {
	// eslint-disable-next-line no-console
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

	const existingExtension = await client.request(readItems('extensions', { filter: { id: { _eq: encodeURIComponent(latestPack.name) } }, fields: ['*'] }))

	if (existingExtension && existingExtension.length > 0) {
		await client.request(updateItem('extensions', encodeURIComponent(latestPack.name), extension))
	} else {
		await client.request(createItem('extensions', extension))
	}

	await client.request(updateItem('extensions', encodeURIComponent(latestPack.name), { latest_version: `${latestPack.name}#${latestVersion}` }))

	// logo: package.logo || null, logo_title: package.name + "-logo"
}
