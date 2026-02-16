import { InvalidQueryError } from '@directus/errors';
import type { Relation, SchemaOverview } from '@directus/types';
import { getRelation, getRelationType } from '@directus/utils';

export type RelationalJsonPathResult = {
	/** The target collection containing the JSON field */
	targetCollection: string;
	/** The JSON field name on the target collection */
	jsonField: string;
	/** The type of the final relation in the path */
	relationType: 'm2o' | 'o2m' | 'a2o';
	/** The relational path segments (without the JSON field) */
	relationalPath: string[];
	/** The relation object for the final step (needed for FK correlation) */
	relation: Relation;
	/** For a2o: the collection scope, e.g., 'circles' from 'item:circles' */
	collectionScope?: string;
	/** For a2o: the junction collection table name */
	junctionCollection?: string;
	/** For a2o: the name of the collection discriminator field on the junction */
	oneCollectionField?: string;
	/** For a2o: the FK field on the junction pointing back to the parent */
	junctionParentField?: string;
	/** For a2o: the polymorphic item FK field on the junction */
	junctionItemField?: string;
	/** For a2o: the O2M relation from parent to junction */
	o2mRelation?: Relation;
	/** Full chain of relations from start to target, used for multi-hop paths (e.g., m2m) */
	relationChain: Array<{ relation: Relation; relationType: 'm2o' | 'o2m' | 'a2o'; sourceCollection: string }>;
};

/**
 * Validates a relational JSON path and returns metadata needed for subquery generation.
 *
 * @param schema - The schema overview containing collection and relation metadata
 * @param startCollection - The collection where the query starts
 * @param field - The field portion from json(field, path), e.g., "category.metadata"
 *
 * @example
 * // For json(category.metadata, color) on products collection:
 * validateRelationalJsonPath(schema, 'products', 'category.metadata')
 * // Returns: { targetCollection: 'categories', jsonField: 'metadata', relationType: 'm2o', ... }
 *
 * @example
 * // For json(comments.data, type) on articles collection (O2M):
 * validateRelationalJsonPath(schema, 'articles', 'comments.data')
 * // Returns: { targetCollection: 'comments', jsonField: 'data', relationType: 'o2m', ... }
 *
 * @example
 * // For json(children.item:circles.metadata, color) on shapes collection (M2A):
 * validateRelationalJsonPath(schema, 'shapes', 'children.item:circles.metadata')
 * // Returns: { targetCollection: 'circles', jsonField: 'metadata', relationType: 'a2o', ... }
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
	let lastRelationType: 'm2o' | 'o2m' | 'a2o' = 'm2o';

	// Full chain of relations from start to target, used for multi-hop paths (e.g., m2m)
	const relationChain: Array<{ relation: Relation; relationType: 'm2o' | 'o2m' | 'a2o'; sourceCollection: string }> = [];

	// A2O-specific metadata, populated when traversing m2a relations
	let a2oInfo: {
		collectionScope: string;
		junctionCollection: string;
		oneCollectionField: string;
		junctionParentField: string;
		junctionItemField: string;
		o2mRelation: Relation;
	} | null = null;

	// Traverse each relation in the path
	for (const segment of relationalPath) {
		// Check if this segment has a collection scope (a2o syntax: item:circles)
		let fieldName = segment;
		let collectionScope: string | null = null;

		if (segment.includes(':')) {
			const [key, scope] = segment.split(':');
			fieldName = key!;
			collectionScope = scope!;
		}

		const relation = getRelation(schema.relations, currentCollection, fieldName);

		if (!relation) {
			throw new InvalidQueryError({
				reason: `Invalid relational JSON path: "${fieldName}" is not a relation on collection "${currentCollection}"`,
			});
		}

		const relationType = getRelationType({
			relation,
			collection: currentCollection,
			field: fieldName,
		});

		if (relationType === 'm2o') {
			relationChain.push({ relation, relationType: 'm2o', sourceCollection: currentCollection });
			currentCollection = relation.related_collection!;
			lastRelationType = 'm2o';
		} else if (relationType === 'o2m') {
			relationChain.push({ relation, relationType: 'o2m', sourceCollection: currentCollection });
			currentCollection = relation.collection;
			lastRelationType = 'o2m';
		} else if (relationType === 'm2a') {
			// M2A: polymorphic relation through a junction table
			// Requires collection scope syntax, e.g., item:circles
			if (!collectionScope) {
				throw new InvalidQueryError({
					reason: `M2A relation "${fieldName}" requires collection scope syntax, e.g., "${fieldName}:collection_name"`,
				});
			}

			const allowedCollections = relation.meta?.one_allowed_collections;

			if (!allowedCollections?.includes(collectionScope)) {
				throw new InvalidQueryError({
					reason: `Collection "${collectionScope}" is not in the allowed collections for M2A field "${fieldName}"`,
				});
			}

			// Store the a2o metadata from the A2O relation and the preceding O2M relation
			a2oInfo = {
				collectionScope,
				junctionCollection: currentCollection, // Current collection IS the junction
				oneCollectionField: relation.meta!.one_collection_field!,
				junctionItemField: fieldName, // e.g., 'item'
				junctionParentField: relation.meta!.junction_field!, // e.g., 'shapes_id'
				o2mRelation: lastRelation!, // The O2M relation from the previous traversal step
			};

			relationChain.push({ relation, relationType: 'a2o', sourceCollection: currentCollection });
			currentCollection = collectionScope;
			lastRelationType = 'a2o';
		} else {
			throw new InvalidQueryError({
				reason: `Could not determine relation type for "${fieldName}" on "${currentCollection}"`,
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
		relationChain,
		...(a2oInfo
			? {
					collectionScope: a2oInfo.collectionScope,
					junctionCollection: a2oInfo.junctionCollection,
					oneCollectionField: a2oInfo.oneCollectionField,
					junctionParentField: a2oInfo.junctionParentField,
					junctionItemField: a2oInfo.junctionItemField,
					o2mRelation: a2oInfo.o2mRelation,
				}
			: {}),
	};
}
