import type { AllCollections } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';

// TODO improve typing
export type SchemaSnapshotOutput = {
	/** `1` for a full snapshot, `2` for a partial (collection-scoped) snapshot. */
	version: number;
	directus: string;
	vendor: string;
	collections: Record<string, any>[];
	fields: Record<string, any>[];
	systemFields: Record<string, any>[];
	relations: Record<string, any>[];
};

/**
 * Optional collection scoping for {@link schemaSnapshot}. Omit for a full snapshot, or provide exactly one of
 * `includeCollections` / `excludeCollections` for a partial snapshot.
 */
export type SchemaSnapshotOptions<Schema> =
	| {
			/**
			 * Restrict the snapshot to these collections (partial snapshot). Mutually exclusive with `excludeCollections`.
			 */
			includeCollections: AllCollections<Schema>[];
	  }
	| {
			/**
			 * Exclude these collections from the snapshot (partial snapshot). Mutually exclusive with `includeCollections`.
			 */
			excludeCollections: AllCollections<Schema>[];
	  };

/**
 * Retrieve the current schema. This endpoint is only available to admin users.
 *
 * @param options Optional collection scoping (partial). Omit for a full snapshot.
 * @param options.includeCollections Restrict the snapshot to these collections.
 * @param options.excludeCollections Exclude these collections from the snapshot.
 *
 * @returns Returns the JSON object containing schema details.
 * @throws Will throw if both `includeCollections` and `excludeCollections` are provided.
 */
export const schemaSnapshot =
	<Schema>(options?: SchemaSnapshotOptions<Schema>): RestCommand<SchemaSnapshotOutput, Schema> =>
	() => {
		const includeCollections = options && 'includeCollections' in options;
		const excludeCollections = options && 'excludeCollections' in options;

		if (includeCollections && excludeCollections) {
			throw new Error(`"includeCollections" and "excludeCollections" parameters cannot be used together`);
		}

		const params: Record<string, string> = {};

		if (includeCollections) params['includeCollections'] = options.includeCollections.join(',');
		if (excludeCollections) params['excludeCollections'] = options.excludeCollections.join(',');

		return {
			method: 'GET',
			path: '/schema/snapshot',
			params,
		};
	};
