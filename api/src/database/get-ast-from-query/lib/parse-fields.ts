import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Accountability, Query, SchemaOverview } from '@directus/types';
import { isEmpty } from 'lodash-es';
import type { FieldNode, FunctionFieldNode, NestedCollectionNode } from '../../../types/index.js';
import { getRelationType } from '../../../utils/get-relation-type.js';
import { convertWildcards } from '../lib/convert-wildcards.js';
import { getDeepQuery } from '../utils/get-deep-query.js';
import { getRelatedCollection } from '../utils/get-related-collection.js';
import { getRelation } from '../utils/get-relation.js';

export async function parseFields(
	schema: SchemaOverview,
	parentCollection: string,
	fields: string[] | null,
	query: Query,
	accountability: Accountability,
	deep?: Record<string, any>,
) {
	if (!fields) return [];

	fields = await convertWildcards(schema, parentCollection, fields, query, accountability);

	if (!fields || !Array.isArray(fields)) return [];

	const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [];

	const relationalStructure: Record<
		string,
		| string[]
		| {
				[collectionScope: string]: string[];
		  }
	> = Object.create(null);

	for (const fieldKey of fields) {
		let name = fieldKey;

		if (query.alias) {
			// check for field alias (is one of the key)
			if (name in query.alias) {
				name = query.alias[fieldKey]!;
			}
		}

		const isRelational =
			name.includes('.') ||
			// We'll always treat top level o2m fields as a related item. This is an alias field, otherwise it won't return
			// anything
			!!schema.relations.find(
				(relation) => relation.related_collection === parentCollection && relation.meta?.one_field === name,
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
						(
							relationalStructure[rootField] as {
								[collectionScope: string]: string[];
							}
						)[collectionScope] = [];
					}

					(
						relationalStructure[rootField] as {
							[collectionScope: string]: string[];
						}
					)[collectionScope]!.push(childKey);
				} else {
					(relationalStructure[rootField] as string[]).push(childKey);
				}
			}
		} else {
			if (fieldKey.includes('(') && fieldKey.includes(')')) {
				const columnName = fieldKey.match(REGEX_BETWEEN_PARENS)![1]!;
				const foundField = schema.collections[parentCollection]!.fields[columnName];

				if (foundField && foundField.type === 'alias') {
					const foundRelation = schema.relations.find(
						(relation) => relation.related_collection === parentCollection && relation.meta?.one_field === columnName,
					);

					if (foundRelation) {
						children.push({
							type: 'functionField',
							name,
							fieldKey,
							query: {},
							relatedCollection: foundRelation.collection,
							whenCase: [],
						});

						continue;
					}
				}
			}

			children.push({ type: 'field', name, fieldKey, whenCase: [] });
		}
	}

	for (const [fieldKey, nestedFields] of Object.entries(relationalStructure)) {
		let fieldName = fieldKey;

		if (query.alias && fieldKey in query.alias) {
			fieldName = query.alias[fieldKey]!;
		}

		const relatedCollection = getRelatedCollection(schema, parentCollection, fieldName);
		const relation = getRelation(schema, parentCollection, fieldName);

		if (!relation) continue;

		const relationType = getRelationType({
			relation,
			collection: parentCollection,
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
				parentKey: schema.collections[parentCollection]!.primary,
				fieldKey: fieldKey,
				relation: relation,
				cases: {},
				whenCase: [],
			};

			for (const relatedCollection of allowedCollections) {
				child.children[relatedCollection] = await parseFields(
					schema,
					relatedCollection,
					Array.isArray(nestedFields)
						? nestedFields
						: (
								nestedFields as {
									[collectionScope: string]: string[];
								}
						  )[relatedCollection] || [],
					query,
					deep?.[`${fieldKey}:${relatedCollection}`],
				);

				child.query[relatedCollection] = getDeepQuery(deep?.[`${fieldKey}:${relatedCollection}`] || {});

				child.relatedKey[relatedCollection] = schema.collections[relatedCollection]!.primary;
			}
		} else if (relatedCollection) {
			// update query alias for children parseFields
			const deepAlias = getDeepQuery(deep?.[fieldKey] || {})?.['alias'];
			if (!isEmpty(deepAlias)) query.alias = deepAlias;

			child = {
				type: relationType,
				name: relatedCollection,
				fieldKey: fieldKey,
				parentKey: schema.collections[parentCollection]!.primary,
				relatedKey: schema.collections[relatedCollection]!.primary,
				relation: relation,
				query: getDeepQuery(deep?.[fieldKey] || {}),
				children: await parseFields(schema, relatedCollection, nestedFields as string[], query, deep?.[fieldKey] || {}),
				cases: [],
				whenCase: [],
			};

			if (relationType === 'o2m' && !child!.query.sort) {
				child!.query.sort = [relation.meta?.sort_field || schema.collections[relation.collection]!.primary];
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
