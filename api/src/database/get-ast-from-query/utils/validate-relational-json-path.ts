import { InvalidQueryError } from '@directus/errors';
import type { Relation, SchemaOverview } from '@directus/types';
import { getRelation } from '@directus/utils';
import { getRelationType } from '../../../utils/get-relation-type.js';

export type RelationalJsonPathResult = {
	/** The target collection containing the JSON field */
	targetCollection: string;
	/** The JSON field name on the target collection */
	jsonField: string;
	/** The type of the final relation in the path */
	relationType: 'm2o' | 'o2m';
	/** The relational path segments (without the JSON field) */
	relationalPath: string[];
	/** The relation object for the final step (needed for FK correlation) */
	relation: Relation;
};

/**
 * Validates a relational JSON path and returns metadata needed for subquery generation.
 *
 * @param schema - The schema overview containing collection and relation metadata
 * @param startCollection - The collection where the query starts
 * @param field - The field portion from json(field:path), e.g., "category.metadata"
 *
 * @example
 * // For json(category.metadata:color) on products collection:
 * validateRelationalJsonPath(schema, 'products', 'category.metadata')
 * // Returns: { targetCollection: 'categories', jsonField: 'metadata', relationType: 'm2o', ... }
 *
 * @example
 * // For json(comments.data:type) on articles collection (O2M):
 * validateRelationalJsonPath(schema, 'articles', 'comments.data')
 * // Returns: { targetCollection: 'comments', jsonField: 'data', relationType: 'o2m', ... }
 */
export function validateRelationalJsonPath(
	schema: SchemaOverview,
	startCollection: string,
	field: string,
): RelationalJsonPathResult {
	const parts = field.split('.');

	if (parts.length < 2) {
		throw new InvalidQueryError({
			reason: `Invalid relational JSON path "${field}": must contain at least one relation and a JSON field`,
		});
	}

	const jsonField = parts.pop()!; // Last segment is the JSON field
	const relationalPath = parts; // Remaining segments are relations

	let currentCollection = startCollection;
	let lastRelation: Relation | null = null;
	let lastRelationType: 'm2o' | 'o2m' = 'm2o';

	// Traverse each relation in the path
	for (const segment of relationalPath) {
		const relation = getRelation(schema.relations, currentCollection, segment);

		if (!relation) {
			throw new InvalidQueryError({
				reason: `Invalid relational JSON path: "${segment}" is not a relation on collection "${currentCollection}"`,
			});
		}

		const relationType = getRelationType({
			relation,
			collection: currentCollection,
			field: segment,
		});

		if (relationType === 'm2o') {
			currentCollection = relation.related_collection!;
			lastRelationType = 'm2o';
		} else if (relationType === 'o2m') {
			currentCollection = relation.collection;
			lastRelationType = 'o2m';
		} else if (relationType === 'a2o') {
			throw new InvalidQueryError({
				reason: `Relational JSON does not support Any-to-One (a2o) relations at "${segment}"`,
			});
		} else {
			throw new InvalidQueryError({
				reason: `Could not determine relation type for "${segment}" on "${currentCollection}"`,
			});
		}

		lastRelation = relation;
	}

	// Validate the JSON field exists on the target collection
	const collectionSchema = schema.collections?.[currentCollection];

	if (!collectionSchema) {
		throw new InvalidQueryError({
			reason: `Collection "${currentCollection}" not found in schema`,
		});
	}

	const fieldSchema = collectionSchema.fields?.[jsonField];

	if (!fieldSchema) {
		throw new InvalidQueryError({
			reason: `Field "${jsonField}" does not exist on collection "${currentCollection}"`,
		});
	}

	if (fieldSchema.type !== 'json') {
		throw new InvalidQueryError({
			reason: `Field "${jsonField}" on collection "${currentCollection}" is not a JSON field (type: ${fieldSchema.type})`,
		});
	}

	return {
		targetCollection: currentCollection,
		jsonField,
		relationType: lastRelationType,
		relationalPath,
		relation: lastRelation!,
	};
}
