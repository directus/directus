import type { ExtensionOptions } from "@directus/types";
import type { Packument, PackumentVersion } from "@npm/types";
import type { ExtensionInfo, NPMDownloads } from "./types.js";
import { octokit } from "./octokit.js";
import type { Endpoints } from "@octokit/types";

export function getExtensionOptions(version: PackumentVersion): ExtensionOptions {
	return (version as any)['directus:extension']
}

export async function getExtension(registry: string, name: string): Promise<ExtensionInfo> {
	// eslint-disable-next-line no-console
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
	// eslint-disable-next-line no-console
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
	// eslint-disable-next-line no-console
	console.log(`Fetching downloads for ${name}`)

	if (registry !== 'registry.npmjs.org') return []

	const response = await fetch(`https://api.npmjs.org/downloads/range/last-year/${name}`)
	const json = await response.json() as NPMDownloads;

	return json.downloads
}
