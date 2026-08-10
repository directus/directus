import { CliError } from '../../../kernel/error.js';
import { byCodepoint } from './codepoint.js';
import type { DataCollection } from './data-store.js';
import { allResources, type Resource } from './resources.js';

export interface SystemCollection {
	readonly data: DataCollection;
	readonly resource: Resource;
}

/** System resources come back in dependency order; content collections are codepoint-sorted. */
export function partitionCollections(collections: readonly DataCollection[]): {
	system: SystemCollection[];
	content: DataCollection[];
} {
	const byCollection = new Map(collections.map((collection) => [collection.collection, collection]));
	const system: SystemCollection[] = [];
	const claimed = new Set<string>();

	for (const resource of allResources()) {
		const data = byCollection.get(resource.collection);

		if (data !== undefined) {
			// A hand-edited key could make validation and import disagree about record identity.
			if (data.primaryKey !== resource.primaryKey) {
				throw new CliError(
					'STATE',
					`The local file for ${data.collection} declares primary key "${data.primaryKey}", but this collection's primary key is "${resource.primaryKey}".`,
					{ hint: 'Fix or delete the data file, then run d6s sync pull again.' },
				);
			}

			system.push({ data, resource });
			claimed.add(resource.collection);
		}
	}

	const content = collections
		.filter((collection) => !claimed.has(collection.collection))
		.sort((a, b) => byCodepoint(a.collection, b.collection));

	return { system, content };
}
