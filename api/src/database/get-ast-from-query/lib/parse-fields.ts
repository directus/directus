import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Accountability, Query, Relation, SchemaOverview } from '@directus/types';
import { getRelation, getRelationType } from '@directus/utils';
import type { Knex } from 'knex';
import { isEmpty } from 'lodash-es';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode, O2MNode } from '../../../types/index.js';
import { parseJsonFunction } from '../../helpers/fn/json/parse-function.js';
import { getAllowedSort } from '../utils/get-allowed-sort.js';
import { getDeepQuery } from '../utils/get-deep-query.js';
import { getRelatedCollection } from '../utils/get-related-collection.js';
import { validateRelationalJsonPath } from '../utils/validate-relational-json-path.js';
import { convertWildcards } from './convert-wildcards.js';

interface CollectionScope {
	[collectionScope: string]: string[];
}

export interface ParseFieldsOptions {
	accountability: Accountability | null;
	parentCollection: string;
	fields: string[] | null;
	query: Query;
	deep?: Record<string, any>;
}

export interface ParseFieldsContext {
	schema: SchemaOverview;
	knex: Knex;
	parentRelation?: Relation;
}

export async function parseFields(
	options: ParseFieldsOptions,
	context: ParseFieldsContext,
): Promise<[] | (NestedCollectionNode | FieldNode | FunctionFieldNode)[]> {
	let { fields } = options;
	if (!fields) return [];

	fields = await convertWildcards(
		{
			fields,
			collection: options.parentCollection,
			alias: options.query.alias,
			accountability: options.accountability,
			backlink: options.query.backlink,
		},
		context,
	);

	if (!fields || !Array.isArray(fields)) return [];

	const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [];

	const policies =
		options.accountability && options.accountability.admin === false
			? await fetchPolicies(options.accountability, context)
			: null;

	const relationalStructure: Record<string, string[] | CollectionScope> = Object.create(null);

	for (const fieldKey of fields) {
		let alias = false;
		let name = fieldKey;

		if (options.query.alias) {
			// check for field alias (is one of the key)
			if (name in options.query.alias) {
				alias = true;
				name = options.query.alias[fieldKey]!;
			}
		}

		// Check for function calls first, before checking if field is relational
		// This handles cases like json(metadata.color) which contain dots but aren't relational
		const isFunctionCall = name.includes('(') && name.includes(')');

		if (isFunctionCall) {
			const functionName = name.split('(')[0]!;
			const columnName = name.match(REGEX_BETWEEN_PARENS)![1]!;

			// For json functions, extract the base field name (before the first dot)
			// json(metadata.color) -> metadata
			const baseFieldName = functionName === 'json' ? columnName.split('.')[0]! : columnName;

			const foundField = context.schema.collections[options.parentCollection]!.fields[baseFieldName];

			// Create a FunctionFieldNode for relational count functions (count(related_items))
			if (foundField && foundField.type === 'alias') {
				const foundRelation = context.schema.relations.find(
					(relation) =>
						relation.related_collection === options.parentCollection && relation.meta?.one_field === baseFieldName,
				);

				if (foundRelation) {
					children.push({
						type: 'functionField',
						name,
						fieldKey,
						query: {},
						relatedCollection: foundRelation.collection,
						whenCase: [],
						cases: [],
					});

					continue;
				}
			}

			// Create a FunctionFieldNode for json functions to preserve the full function call
			// This is needed because json() requires the full path (e.g., json(metadata, color))
			if (functionName === 'json') {
				const { field, path } = parseJsonFunction(name);

				// Check if the field portion contains a relational path (has dots)
				// e.g., json(category.metadata, color) where category is a relation
				if (field.includes('.')) {
					// Relational JSON: validate the path and get target collection info
					const validation = validateRelationalJsonPath(context.schema, options.parentCollection, field);

					children.push({
						type: 'functionField',
						name,
						fieldKey,
						query: {},
						relatedCollection: validation.targetCollection,
						whenCase: [],
						cases: [],
						relationalJsonContext: {
							relationalPath: validation.relationalPath,
							jsonField: validation.jsonField,
							jsonPath: path,
							hasWildcard: false,
							relationType: validation.relationType,
							relation: validation.relation,
							targetCollection: validation.targetCollection,
							...(validation.collectionScope
								? {
										collectionScope: validation.collectionScope,
										junctionCollection: validation.junctionCollection!,
										oneCollectionField: validation.oneCollectionField!,
										junctionParentField: validation.junctionParentField!,
										junctionItemField: validation.junctionItemField!,
										o2mRelation: validation.o2mRelation!,
									}
								: {}),
						},
					});
				} else {
					// Direct JSON field on current collection: json(metadata, color)
					children.push({
						type: 'functionField',
						name,
						fieldKey,
						query: {},
						relatedCollection: options.parentCollection,
						whenCase: [],
						cases: [],
					});
				}

				continue;
			}

			// For all other functions (year, month, etc.), treat as regular field
			// Skip the relational check and create a FieldNode
		}

		// Only check if field is relational if it's NOT a function call
		const isRelational =
			!isFunctionCall &&
			(name.includes('.') ||
				// We'll always treat top level o2m fields as a related item. This is an alias field, otherwise it won't return
				// anything
				!!context.schema.relations.find(
					(relation) => relation.related_collection === options.parentCollection && relation.meta?.one_field === name,
				));

		if (isRelational) {
			// field is relational
			const parts = fieldKey.split('.');

			let rootField = parts[0]!;
			let collectionScope: string | null = null;

			// a2o related collection scoped field selector `fields=sections.section_id:headings.title`
			if (rootField.includes(':')) {
				const [key, scope] = rootField.split(':');
				rootField = key!;
				collectionScope = scope!;
			}

			if (rootField in relationalStructure === false) {
				if (collectionScope) {
					relationalStructure[rootField] = { [collectionScope]: [] };
				} else {
					relationalStructure[rootField] = [];
				}
			}

			if (parts.length > 1) {
				const childKey = parts.slice(1).join('.');

				if (collectionScope) {
					if (collectionScope in relationalStructure[rootField]! === false) {
						(relationalStructure[rootField] as CollectionScope)[collectionScope] = [];
					}

					(relationalStructure[rootField] as CollectionScope)[collectionScope]!.push(childKey);
				} else {
					(relationalStructure[rootField] as string[]).push(childKey);
				}
			}
		} else {
			if (name.includes(':')) {
				const [key, scope] = name.split(':') as [string, string];

				if (key in relationalStructure === false) {
					relationalStructure[key] = { [scope]: [] };
				} else if (scope in (relationalStructure[key] as CollectionScope) === false) {
					(relationalStructure[key] as CollectionScope)[scope] = [];
				}

				continue;
			}

			children.push({ type: 'field', name, fieldKey, whenCase: [], alias });
		}
	}

	for (const [fieldKey, nestedFields] of Object.entries(relationalStructure)) {
		let fieldName = fieldKey;

		if (options.query.alias && fieldKey in options.query.alias) {
			fieldName = options.query.alias[fieldKey]!;
		}

		const relatedCollection = getRelatedCollection(context.schema, options.parentCollection, fieldName);
		const relation = getRelation(context.schema.relations, options.parentCollection, fieldName);

		if (!relation) continue;

		const relationType = getRelationType({
			relation,
			collection: options.parentCollection,
			field: fieldName,
			useA2O: true,
		});

		if (!relationType) continue;

		let child: NestedCollectionNode | null = null;

		if (relationType === 'a2o') {
			let allowedCollections = relation.meta!.one_allowed_collections!;

			if (options.accountability && options.accountability.admin === false && policies) {
				const permissions = await fetchPermissions(
					{
						action: 'read',
						collections: allowedCollections,
						policies: policies,
						accountability: options.accountability,
					},
					context,
				);

				allowedCollections = allowedCollections.filter((collection) =>
					permissions.some((permission) => permission.collection === collection),
				);
			}

			child = {
				type: 'a2o',
				names: allowedCollections,
				children: {},
				query: {},
				relatedKey: {},
				parentKey: context.schema.collections[options.parentCollection]!.primary,
				fieldKey: fieldKey,
				relation: relation,
				cases: {},
				whenCase: [],
			};

			for (const relatedCollection of allowedCollections) {
				child.children[relatedCollection] = await parseFields(
					{
						parentCollection: relatedCollection,
						fields: Array.isArray(nestedFields)
							? nestedFields
							: (nestedFields as CollectionScope)[relatedCollection] || [],
						query: options.query,
						deep: options.deep?.[`${fieldKey}:${relatedCollection}`],
						accountability: options.accountability,
					},
					{ ...context, parentRelation: relation },
				);

				child.query[relatedCollection] = getDeepQuery(options.deep?.[`${fieldKey}:${relatedCollection}`] || {});

				child.relatedKey[relatedCollection] = context.schema.collections[relatedCollection]!.primary;
			}
		} else if (relatedCollection) {
			if (options.accountability && options.accountability.admin === false && policies) {
				const permissions = await fetchPermissions(
					{
						action: 'read',
						collections: [relatedCollection],
						policies: policies,
						accountability: options.accountability,
					},
					context,
				);

				// Skip related collection if no permissions
				if (permissions.length === 0) {
					continue;
				}
			}

			const childQuery = { ...options.query };

			// update query alias for children parseFields
			const deepAlias = getDeepQuery(options.deep?.[fieldKey] || {})?.['alias'];

			// reset alias to empty if none are present
			childQuery.alias = isEmpty(deepAlias) ? {} : deepAlias;

			child = {
				type: relationType,
				name: relatedCollection,
				fieldKey: fieldKey,
				parentKey: context.schema.collections[options.parentCollection]!.primary,
				relatedKey: context.schema.collections[relatedCollection]!.primary,
				relation: relation,
				query: getDeepQuery(options.deep?.[fieldKey] || {}),
				children: await parseFields(
					{
						parentCollection: relatedCollection,
						fields: nestedFields as string[],
						query: childQuery,
						deep: options.deep?.[fieldKey] || {},
						accountability: options.accountability,
					},
					{ ...context, parentRelation: relation },
				),
				cases: [],
				whenCase: [],
			};

			if (isO2MNode(child) && !child.query.sort) {
				child.query.sort = await getAllowedSort(
					{ collection: relation.collection, relation, accountability: options.accountability },
					context,
				);
			}

			if (isO2MNode(child) && child.query.group && child.query.group[0] !== relation.field) {
				// If a group by is used, the result needs to be grouped by the foreign key of the relation first, so results
				// are correctly grouped under the foreign key when extracting the grouped results from the nested queries.
				child.query.group.unshift(relation.field);
			}
		}

		if (child) {
			children.push(child);
		}
	}

	// Deduplicate any children fields that are included both as a regular field, and as a nested m2o field
	const nestedCollectionNodes = children.filter((childNode) => childNode.type !== 'field');

	return children.filter((childNode) => {
		const existsAsNestedRelational = !!nestedCollectionNodes.find(
			(nestedCollectionNode) => childNode.fieldKey === nestedCollectionNode.fieldKey,
		);

		if (childNode.type === 'field' && existsAsNestedRelational) return false;

		return true;
	});
}

export function isO2MNode(node: NestedCollectionNode | null): node is O2MNode {
	return !!node && node.type === 'o2m';
}
