import fetch from "node-fetch";
import type { NPMSearchResponse } from "./npm-types.js";

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

	// eslint-disable-next-line no-console
	console.log(`Found ${extensions.size} extensions.`)

	return Array.from(extensions);
}
