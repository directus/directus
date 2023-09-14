import { client } from "./directus-sdk.js";
import { importFile, readFiles } from '@directus/sdk/rest';

export async function fetchFile(name: string, url: string): Promise<string> {

	const existing = await client.request(readFiles({
		filter: {
			title: {
				_eq: name,
			}
		},
		fields: ['*'],
	}))

	if (existing.length > 0) {
		return existing[0]!.id
	}

	const file = await client.request(importFile(url, {
		title: name,
	}))

	return file.id
}
