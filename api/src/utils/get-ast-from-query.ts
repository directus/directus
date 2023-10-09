/**
 * Generate an AST based on a given collection and query
 */

import { REGEX_BETWEEN_PARENS } from '@directus/constants';
import type { Accountability, PermissionsAction, Query, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { cloneDeep, isEmpty, mapKeys, omitBy, uniq } from 'lodash-es';
import type { AST, FieldNode, FunctionFieldNode, NestedCollectionNode } from '../types/index.js';
import { getRelationType } from './get-relation-type.js';

type GetASTOptions = {
	accountability?: Accountability | null;
	action?: PermissionsAction;
	knex?: Knex;
};

type anyNested = {
	[collectionScope: string]: string[];
};

export default async function getASTFromQuery(
	collection: string,
	query: Query,
	schema: SchemaOverview,
	options?: GetASTOptions
): Promise<AST> {
	query = cloneDeep(query);

	const accountability = options?.accountability;
	const action = options?.action || 'read';

	const permissions =
		accountability && accountability.admin !== true
			? accountability?.permissions?.filter((permission) => {
					return permission.action === action;
			  }) ?? []
			: null;

	const ast: AST = {
		type: 'root',
		name: collection,
		query: query,
		children: [],
	};

	let fields = ['*'];

	if (query.fields) {
		fields = query.fields;
	}

	/**
	 * When using aggregate functions, you can't have any other regular fields
	 * selected. This makes sure you never end up in a non-aggregate fields selection error
	 */
	if (Object.keys(query.aggregate || {}).length > 0) {
		fields = [];
	}

	/**
	 * Similarly, when grouping on a specific field, you can't have other non-aggregated fields.
	 * The group query will override the fields query
	 */
	if (query.group) {
		fields = query.group;
	}

	fields = uniq(fields);

	const deep = query.deep || {};

	// Prevent fields/deep from showing up in the query object in further use
	delete query.fields;
	delete query.deep;

	if (!query.sort) {
		// We'll default to the primary key for the standard sort output
		let sortField = schema.collections[collection]!.primary;

		// If a custom manual sort field is configured, use that
		if (schema.collections[collection]?.sortField) {
			sortField = schema.collections[collection]!.sortField as string;
		}

		// When group by is used, default to the first column provided in the group by clause
		if (query.group?.[0]) {
			sortField = query.group[0];
		}

		query.sort = [sortField];
	}

	// When no group by is supplied, but an aggregate function is used, only a single row will be
	// returned. In those cases, we'll ignore the sort field altogether
	if (query.aggregate && Object.keys(query.aggregate).length && !query.group?.[0]) {
		delete query.sort;
	}

	ast.children = await parseFields(collection, fields, deep);

	return ast;

	async function parseFields(parentCollection: string, fields: string[] | null, deep?: Record<string, any>) {
		if (!fields) return [];

		fields = await convertWildcards(parentCollection, fields);

		if (!fields || !Array.isArray(fields)) return [];

		const children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[] = [];

		const relationalStructure: Record<string, string[] | anyNested> = Object.create(null);

		for (const fieldKey of fields) {
			let name = fieldKey;

			if (query.alias) {
				// check for field alias (is is one of the key)
				if (name in query.alias) {
					name = query.alias[fieldKey]!;
				}
			}

			const isRelational =
				name.includes('.') ||
				// We'll always treat top level o2m fields as a related item. This is an alias field, otherwise it won't return
				// anything
				!!schema.relations.find(
					(relation) => relation.related_collection === parentCollection && relation.meta?.one_field === name
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
							(relationalStructure[rootField] as anyNested)[collectionScope] = [];
						}

						(relationalStructure[rootField] as anyNested)[collectionScope]!.push(childKey);
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
							(relation) => relation.related_collection === parentCollection && relation.meta?.one_field === columnName
						);

						if (foundRelation) {
							children.push({
								type: 'functionField',
								name,
								fieldKey,
								query: {},
								relatedCollection: foundRelation.collection,
							});

							continue;
						}
					}
				}

				children.push({ type: 'field', name, fieldKey });
			}
		}

		for (const [fieldKey, nestedFields] of Object.entries(relationalStructure)) {
			let fieldName = fieldKey;

			if (query.alias && fieldKey in query.alias) {
				fieldName = query.alias[fieldKey]!;
			}

			const relatedCollection = getRelatedCollection(parentCollection, fieldName);
			const relation = getRelation(parentCollection, fieldName);

			if (!relation) continue;

			const relationType = getRelationType({
				relation,
				collection: parentCollection,
				field: fieldName,
			});

			if (!relationType) continue;

			let child: NestedCollectionNode | null = null;

			if (relationType === 'a2o') {
				const allowedCollections = relation.meta!.one_allowed_collections!.filter((collection) => {
					if (!permissions) return true;
					return permissions.some((permission) => permission.collection === collection);
				});

				child = {
					type: 'a2o',
					names: allowedCollections,
					children: {},
					query: {},
					relatedKey: {},
					parentKey: schema.collections[parentCollection]!.primary,
					fieldKey: fieldKey,
					relation: relation,
				};

				for (const relatedCollection of allowedCollections) {
					child.children[relatedCollection] = await parseFields(
						relatedCollection,
						Array.isArray(nestedFields) ? nestedFields : (nestedFields as anyNested)[relatedCollection] || [],
						deep?.[`${fieldKey}:${relatedCollection}`]
					);

					child.query[relatedCollection] = getDeepQuery(deep?.[`${fieldKey}:${relatedCollection}`] || {});

					child.relatedKey[relatedCollection] = schema.collections[relatedCollection]!.primary;
				}
			} else if (relatedCollection) {
				if (permissions && permissions.some((permission) => permission.collection === relatedCollection) === false) {
					continue;
				}

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
					children: await parseFields(relatedCollection, nestedFields as string[], deep?.[fieldKey] || {}),
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
				(nestedCollectionNode) => childNode.fieldKey === nestedCollectionNode.fieldKey
			);

			if (childNode.type === 'field' && existsAsNestedRelational) return false;

			return true;
		});
	}

	async function convertWildcards(parentCollection: string, fields: string[]) {
		fields = cloneDeep(fields);

		const fieldsInCollection = Object.entries(schema.collections[parentCollection]!.fields).map(([name]) => name);

		let allowedFields: string[] | null = fieldsInCollection;

		if (permissions) {
			const permittedFields = permissions.find((permission) => parentCollection === permission.collection)?.fields;
			if (permittedFields !== undefined) allowedFields = permittedFields;
		}

		if (!allowedFields || allowedFields.length === 0) return [];

		// In case of full read permissions
		if (allowedFields[0] === '*') allowedFields = fieldsInCollection;

		for (let index = 0; index < fields.length; index++) {
			const fieldKey = fields[index]!;

			if (fieldKey.includes('*') === false) continue;

			if (fieldKey === '*') {
				const aliases = Object.keys(query.alias ?? {});

				// Set to all fields in collection
				if (allowedFields.includes('*')) {
					fields.splice(index, 1, ...fieldsInCollection, ...aliases);
				} else {
					// Set to all allowed fields
					const allowedAliases = aliases.filter((fieldKey) => {
						const name = query.alias![fieldKey]!;
						return allowedFields!.includes(name);
					});

					fields.splice(index, 1, ...allowedFields, ...allowedAliases);
				}
			}

			// Swap *.* case for *,<relational-field>.*,<another-relational>.*
			if (fieldKey.includes('.') && fieldKey.split('.')[0] === '*') {
				const parts = fieldKey.split('.');

				const relationalFields = allowedFields.includes('*')
					? schema.relations
							.filter(
								(relation) =>
									relation.collection === parentCollection || relation.related_collection === parentCollection
							)
							.map((relation) => {
								const isMany = relation.collection === parentCollection;
								return isMany ? relation.field : relation.meta?.one_field;
							})
					: allowedFields.filter((fieldKey) => !!getRelation(parentCollection, fieldKey));

				const nonRelationalFields = allowedFields.filter((fieldKey) => relationalFields.includes(fieldKey) === false);

				const aliasFields = Object.keys(query.alias ?? {}).map((fieldKey) => {
					const name = query.alias![fieldKey];

					if (relationalFields.includes(name)) {
						return `${fieldKey}.${parts.slice(1).join('.')}`;
					}

					return fieldKey;
				});

				fields.splice(
					index,
					1,
					...[
						...relationalFields.map((relationalField) => {
							return `${relationalField}.${parts.slice(1).join('.')}`;
						}),
						...nonRelationalFields,
						...aliasFields,
					]
				);
			}
		}

		return fields;
	}

	function getRelation(collection: string, field: string) {
		const relation = schema.relations.find((relation) => {
			return (
				(relation.collection === collection && relation.field === field) ||
				(relation.related_collection === collection && relation.meta?.one_field === field)
			);
		});

		return relation;
	}

	function getRelatedCollection(collection: string, field: string): string | null {
		const relation = getRelation(collection, field);

		if (!relation) return null;

		if (relation.collection === collection && relation.field === field) {
			return relation.related_collection || null;
		}

		if (relation.related_collection === collection && relation.meta?.one_field === field) {
			return relation.collection || null;
		}

		return null;
	}
}

function getDeepQuery(query: Record<string, any>) {
	return mapKeys(
		omitBy(query, (_value, key) => key.startsWith('_') === false),
		(_value, key) => key.substring(1)
	);
}
