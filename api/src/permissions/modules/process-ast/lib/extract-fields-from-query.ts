import type { Query, SchemaOverview } from '@directus/types';
import { parseFilterKey } from '../../../../utils/parse-filter-key.js';
import type { CollectionKey, FieldKey, FieldMap } from '../types.js';
import { extractPathsFromQuery } from '../utils/extract-paths-from-query.js';
import { findRelatedCollection } from '../utils/find-related-collection.js';
import { getInfoForPath } from '../utils/get-info-for-path.js';

export function extractFieldsFromQuery(
	collection: CollectionKey,
	query: Query,
	fieldMap: FieldMap,
	schema: SchemaOverview,
	pathPrefix: FieldKey[] = [],
) {
	if (!query) return;

	const { paths: otherPaths, readOnlyPaths } = extractPathsFromQuery(query);

	const groupedPaths = {
		other: otherPaths,
		read: readOnlyPaths,
	};

	for (const [group, paths] of Object.entries(groupedPaths) as [keyof FieldMap, string[][]][]) {
		for (const path of paths) {
			/**
			 * Current path stack. For each iteration of the path loop this will be appended with the
			 * current part we're operating on. So when looping over ['category', 'created_by', 'name']
			 * the first iteration it'll be `['category']`, and then `['category', 'created_by']` etc.
			 */
			const stack = [];

			/**
			 * Current collection the path part we're operating on lives in. Once we hit a relational
			 * field, this will be updated to the related collection, so we can follow the relational path
			 * left to right.
			 */
			let collectionContext = collection;

			for (const part of path) {
				const info = getInfoForPath(fieldMap, group, [...pathPrefix, ...stack], collectionContext);

				// A2o specifier field fetch
				if (part.includes(':')) {
					const [fieldKey, collection] = part.split(':') as [string, string];
					info.fields.add(fieldKey);
					collectionContext = collection;
					stack.push(part);
					continue;
				}

				if (part.startsWith('$FOLLOW(') && part.endsWith(')')) {
					// Don't add this implicit relation field to fields, as it will be accounted for in the reverse direction
				} else {
					const { fieldName } = parseFilterKey(part);
					info.fields.add(fieldName);
				}

				/**
				 * Related collection for the current part. Is null when the current field isn't a
				 * relational field.
				 */
				const relatedCollection = findRelatedCollection(collectionContext, part, schema);

				if (relatedCollection) {
					collectionContext = relatedCollection;
					stack.push(part);
				}
			}
		}
	}
}
