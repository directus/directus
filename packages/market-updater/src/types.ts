import type { Packument } from '@npm/types'
import type { Endpoints } from '@octokit/types'
import type { z } from 'zod'
import type { MarketExtensionManifest } from './validate-package.js'

type Relation<T> = Partial<T> | string

export type Download = {
	id: string,
	date: string,
	downloads: number,
	extension: Relation<Extension>

}

export type ExtensionType = {
	type: string,
	name: string
}

export type Extension = {
	id: string,
	description: string,
	homepage: string,
	icon: string,
	logo: Relation<DirectusFile>,
	created: string,
	updated: string,
	tags: Relation<ExtensionsTags>[]
	author: Relation<User>,
	maintainers: Relation<ExtensionsUsers>[],
	versions: Relation<Version>[],
	latest_version: Relation<Version>,
	stars: number,
	downloads: Relation<Download>[],
	downloads_last_month: number,
	downloads_last_year: number,
	registry: string
}

export type ExtensionsTags = {
	id?: string,
	extensions_id?: Relation<Extension>,
	tags_tag: Relation<Tag>
}

export type ExtensionsUsers = {
	id: string,
	extensions_id: Relation<Extension>,
	users_id: Relation<User>
}

export type Featured = {
	id: string,
	sort: number,
	date: string,
	carousel: boolean,
	image: Relation<DirectusFile>,
	color: string,
	extension: Relation<Extension>
}

export type Permission = {
	id?: string,
	permission: string,
	optional: boolean,
	options: Record<string, any>,
	extension_version?: Relation<Version>,
}

export type Tag = {
	tag: string
}

export type User = {
	id: string,
	email: string,
	avatar?: Relation<DirectusFile>,
	name: string,
	url: string,
	readme: string,
	trusted: boolean,
	core_contributor: boolean,
	author_of: Relation<Extension>[],
}

export type Version = {
	version: string,
	secure: boolean,
	requested_permissions: Relation<Permission>[],
	size: number | null,
	readme: string,
	types: Relation<VersionsExtensionTypes>[],
	license: string,
	directus_version: string,
	extension?: Relation<Extension>,
}

export type VersionsExtensionTypes = {
	id: string,
	versions_version: Relation<Version>,
	extension_types_type: Relation<ExtensionType>
}

export type DirectusFile = {
	id: string,
	title: string,
	description: string,
	tags: string,
	location: string,
	storage: string,
	filename_disk: string,
	filename_download: string,
}

export interface Schema {
	downloads: Download[],
	extensions: Extension[],
	extensions_types: ExtensionType[],
	extensions_tags: ExtensionsTags[],
	extensions_users: ExtensionsUsers[],
	featured: Featured[],
	permissions: Permission[],
	tags: Tag[],
	users: User[],
	versions: Version[],
	versions_extension_types: VersionsExtensionTypes[],
	directus_files: DirectusFile[],
}

export type MarketExtensionManifestType = z.infer<typeof MarketExtensionManifest>


export type ExtensionInfo = {
	npm: Omit<Packument, 'versions'>,
	versions: Record<string, MarketExtensionManifestType>,
	github?: Endpoints["GET /repos/{owner}/{repo}"]['response']['data'] | undefined,
	downloads: NPMDownloads['downloads'],
	ignoreVersions: string[],
	latestVersion: string,
	readmes?: Record<string, string> | undefined,
}

export type NPMDownloads = {
	start: string,
	end: string,
	package: string,
	downloads: {
		downloads: number,
		day: string
	}[]
}
