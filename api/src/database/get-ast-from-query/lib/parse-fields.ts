import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Accountability, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { isEmpty } from 'lodash-es';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../types/index.js';
import { getRelationType } from '../../../utils/get-relation-type.js';
import { getDeepQuery } from '../utils/get-deep-query.js';
import { getRelatedCollection } from '../utils/get-related-collection.js';
import { getRelation } from '../utils/get-relation.js';
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
			parentCollection: options.parentCollection,
			query: options.query,
			accountability: options.accountability,
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
		let name = fieldKey;

		if (options.query.alias) {
			// check for field alias (is one of the key)
			if (name in options.query.alias) {
				name = options.query.alias[fieldKey]!;
			}
		}

		const isRelational =
			name.includes('.') ||
			// We'll always treat top level o2m fields as a related item. This is an alias field, otherwise it won't return
			// anything
			!!context.schema.relations.find(
				(relation) => relation.related_collection === options.parentCollection && relation.meta?.one_field === name,
			);

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
			if (name.includes('(') && name.includes(')')) {
				const columnName = name.match(REGEX_BETWEEN_PARENS)![1]!;
				const foundField = context.schema.collections[options.parentCollection]!.fields[columnName];

				if (foundField && foundField.type === 'alias') {
					const foundRelation = context.schema.relations.find(
						(relation) =>
							relation.related_collection === options.parentCollection && relation.meta?.one_field === columnName,
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
			}

			if (name.includes(':')) {
				const [key, scope] = name.split(':') as [string, string];

				if (key in relationalStructure === false) {
					relationalStructure[key] = { [scope]: [] };
				} else if (scope in (relationalStructure[key] as CollectionScope) === false) {
					(relationalStructure[key] as CollectionScope)[scope] = [];
				}

				continue;
			}

			children.push({ type: 'field', name, fieldKey, whenCase: [] });
		}
	}

	for (const [fieldKey, nestedFields] of Object.entries(relationalStructure)) {
		let fieldName = fieldKey;

		if (options.query.alias && fieldKey in options.query.alias) {
			fieldName = options.query.alias[fieldKey]!;
		}

		const relatedCollection = getRelatedCollection(context.schema, options.parentCollection, fieldName);
		const relation = getRelation(context.schema, options.parentCollection, fieldName);

		if (!relation) continue;

		const relationType = getRelationType({
			relation,
			collection: options.parentCollection,
			field: fieldName,
		});

		if (!relationType) continue;

		let child: NestedCollectionNode | null = null;

		if (relationType === 'a2o') {
			const allowedCollections = relation.meta!.one_allowed_collections!;

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
					context,
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

			// update query alias for children parseFields
			const deepAlias = getDeepQuery(options.deep?.[fieldKey] || {})?.['alias'];
			if (!isEmpty(deepAlias)) options.query.alias = deepAlias;

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
						query: options.query,
						deep: options.deep?.[fieldKey] || {},
						accountability: options.accountability,
					},
					context,
				),
				cases: [],
				whenCase: [],
			};

			if (relationType === 'o2m' && !child!.query.sort) {
				child!.query.sort = [relation.meta?.sort_field || context.schema.collections[relation.collection]!.primary];
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
