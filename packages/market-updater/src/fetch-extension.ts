import type { ExtensionOptions } from "@directus/types";
import type { Packument } from "@npm/types";
import type { ExtensionInfo, MarketExtensionManifestType, NPMDownloads } from "./types.js";
import { octokit } from "./octokit.js";
import type { Endpoints } from "@octokit/types";
import { MarketExtensionManifest } from "./validate-package.js";
import { batchPromise } from "./batch-promise.js";

export async function getExtension(registry: string, name: string): Promise<ExtensionInfo> {
	// eslint-disable-next-line no-console
	console.log(`Fetching ${name}`)

	const response = await fetch(`https://${registry}/${name}`)
	const npmInfo = await response.json() as Packument;

	const ignoreVersions: string[] = []
	const latestVersion = npmInfo['dist-tags']?.latest

	if (latestVersion === undefined) throw new Error(`${name}: No latest version.`)

	if (Object.keys(npmInfo.versions).length === 0) throw new Error(`${name}: At least 1 version has to be released.`)

	const versions: Record<string, MarketExtensionManifestType> = {}

	for (const [version, pack] of Object.entries(npmInfo.versions)) {
		try {
			versions[version] = MarketExtensionManifest.parse(pack)
		} catch (error: any) {

			if (version === latestVersion) {
				throw new Error(`${name}#${version}: ${error}`)
			} else {
				ignoreVersions.push(version)
			}
		}
	}

	let github = undefined
	let readmes: Record<string, string> | undefined = undefined
	const repository = versions[latestVersion]?.repository

	if (repository) {
		const githubMatch = /^git\+https:\/\/github\.com\/(.*?)\.git$/.exec(repository)

		if (githubMatch) {
			const owner = githubMatch[1]!.split('/')[0]!
			const repo = githubMatch[1]!.split('/')[1]!

			github = (await octokit.request('GET /repos/{owner}/{repo}', { owner, repo })).data

			// eslint-disable-next-line no-console
			console.log(`Fetching readmes for ${name}}`)

			const fetchedReadmes = await batchPromise(Object.values(versions), 10, async (version) => {
				const options: Endpoints['GET /repos/{owner}/{repo}/readme']['parameters'] = { owner, repo }

				if (version.version !== latestVersion) options.ref = version.version

				const { data: { content } } = await octokit.request('GET /repos/{owner}/{repo}/readme', options)

				return [version.version, content]
			})

			readmes = Object.fromEntries(fetchedReadmes)
		}
	}

	const downloads = await fetchDownloads(registry, name)

	return {
		npm: npmInfo,
		versions,
		github,
		downloads,
		ignoreVersions,
		latestVersion,
		readmes
	}
}

export async function fetchDownloads(registry: string, name: string) {
	// eslint-disable-next-line no-console
	console.log(`Fetching downloads for ${name}`)

	if (registry !== 'registry.npmjs.org') return []

	const response = await fetch(`https://api.npmjs.org/downloads/range/last-year/${name}`)
	const json = await response.json() as NPMDownloads;

	return json.downloads
}
