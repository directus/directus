import type { Query, SchemaOverview } from '@directus/types';
import { getRelationInfo, isImplicitRelation } from '@directus/utils';
import { parseFilterKey } from '../../../../utils/parse-filter-key.js';
import type { CollectionKey, FieldKey } from '../types.js';
import { extractPathsFromQuery } from '../utils/extract-paths-from-query.js';
import { addToFieldMap, type FieldMap, type FieldMapGroup } from './field-map.js';

/**
 * Add the fields that a query uses to the field map. Each path from `extractPathsFromQuery` is followed through the
 * relations of the schema, adding each part to the collection it belongs to under the path leading to it. `item:pages`
 * switches to the related collection of an a2o field, and `$FOLLOW(...)` reverse relations are followed without adding
 * a field.
 *
 * @param pathPrefix - Query path of the node the query belongs to
 */
export function extractFieldsFromQuery(
	collection: CollectionKey,
	query: Query,
	fieldMap: FieldMap,
	schema: SchemaOverview,
	pathPrefix: FieldKey[] = [],
) {
	if (!query) return;

	const { actionPaths, readPaths } = extractPathsFromQuery(query);

	const groupedPaths = {
		action: actionPaths,
		read: readPaths,
	};

	for (const [group, paths] of Object.entries(groupedPaths) as [FieldMapGroup, string[][]][]) {
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
				// a2o parts are scoped to a related collection, `item:pages`
				const [field, a2oCollection] = part.split(':') as [string, string | undefined];

				// Don't add implicit $FOLLOW relation fields, as they're accounted for in the reverse direction
				addToFieldMap(
					fieldMap,
					group,
					[...pathPrefix, ...stack],
					collectionContext,
					isImplicitRelation(part) ? undefined : parseFilterKey(field).fieldName,
				);

				if (a2oCollection) {
					collectionContext = a2oCollection;
					stack.push(part);
					continue;
				}

				/**
				 * Related collection for the current part. Is null when the current field isn't a
				 * relational field.
				 */
				const { oppositeCollection: relatedCollection } = getRelationInfo(schema.relations, collectionContext, part);

				if (relatedCollection) {
					collectionContext = relatedCollection;
					stack.push(part);
				}
			}
		}
	}
}
