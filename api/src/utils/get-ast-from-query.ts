/**
 * Generate an AST based on a given collection and query
 */

import {
	AST,
	NestedCollectionNode,
	FieldNode,
	Query,
	Relation,
	PermissionsAction,
	Accountability,
} from '../types';
import database from '../database';
import { cloneDeep } from 'lodash';
import Knex from 'knex';
import SchemaInspector from 'knex-schema-inspector';
import { getRelationType } from '../utils/get-relation-type';
import { systemFieldRows } from '../database/system-data/fields';
import { systemRelationRows } from '../database/system-data/relations';

type GetASTOptions = {
	accountability?: Accountability | null;
	action?: PermissionsAction;
	knex?: Knex;
};

export default async function getASTFromQuery(
	collection: string,
	query: Query,
	options?: GetASTOptions
): Promise<AST> {
	query = cloneDeep(query);

	const accountability = options?.accountability;
	const action = options?.action || 'read';
	const knex = options?.knex || database;
	const schemaInspector = SchemaInspector(knex);

	/**
	 * we might not need al this info at all times, but it's easier to fetch it all once, than trying to fetch it for every
	 * requested field. @todo look into utilizing graphql/dataloader for this purpose
	 */
	const relations = [
		...(await knex.select<Relation[]>('*').from('directus_relations')),
		...systemRelationRows,
	];

	const permissions =
		accountability && accountability.admin !== true
			? await knex
					.select<{ collection: string; fields: string }[]>('collection', 'fields')
					.from('directus_permissions')
					.where({ role: accountability.role, action: action })
			: null;

	const ast: AST = {
		type: 'root',
		name: collection,
		query: query,
		children: [],
	};

	const fields = query.fields || ['*'];
	const deep = query.deep || {};

	// Prevent fields/deep from showing up in the query object in further use
	delete query.fields;
	delete query.deep;

	ast.children = await parseFields(collection, fields, deep);

	return ast;

	async function parseFields(
		parentCollection: string,
		fields: string[],
		deep?: Record<string, Query>
	) {
		fields = await convertWildcards(parentCollection, fields);

		if (!fields) return [];

		const children: (NestedCollectionNode | FieldNode)[] = [];

		const relationalStructure: Record<string, string[]> = {};

		for (const field of fields) {
			const isRelational =
				field.includes('.') ||
				// We'll always treat top level o2m fields as a related item. This is an alias field, otherwise it won't return
				// anything
				!!relations.find(
					(relation) =>
						relation.one_collection === parentCollection && relation.one_field === field
				);

			if (isRelational) {
				// field is relational
				const parts = field.split('.');

				if (relationalStructure.hasOwnProperty(parts[0]) === false) {
					relationalStructure[parts[0]] = [];
				}

				if (parts.length > 1) {
					relationalStructure[parts[0]].push(parts.slice(1).join('.'));
				}
			} else {
				children.push({ type: 'field', name: field });
			}
		}

		for (const [relationalField, nestedFields] of Object.entries(relationalStructure)) {
			const relatedCollection = getRelatedCollection(parentCollection, relationalField);
			const relation = getRelation(parentCollection, relationalField);

			if (!relation) continue;

			const relationType = getRelationType({
				relation,
				collection: parentCollection,
				field: relationalField,
			});

			if (!relationType) continue;

			let child: NestedCollectionNode | null = null;

			if (relationType === 'm2a') {
				const allowedCollections = relation.one_allowed_collections!.split(',');

				child = {
					type: 'm2a',
					names: allowedCollections,
					children: {},
					query: {},
					relatedKey: {},
					parentKey: await schemaInspector.primary(parentCollection),
					fieldKey: relationalField,
					relation: relation,
				};

				for (const relatedCollection of allowedCollections) {
					child.children[relatedCollection] = await parseFields(
						relatedCollection,
						nestedFields
					);
					child.query[relatedCollection] = {};
					child.relatedKey[relatedCollection] = await schemaInspector.primary(
						relatedCollection
					);
				}
			} else if (relatedCollection) {
				child = {
					type: relationType,
					name: relatedCollection,
					fieldKey: relationalField,
					parentKey: await schemaInspector.primary(parentCollection),
					relatedKey: await schemaInspector.primary(relatedCollection),
					relation: relation,
					query: deep?.[relationalField] || {},
					children: await parseFields(relatedCollection, nestedFields),
				};
			}

			if (child) {
				children.push(child);
			}
		}

		return children;
	}

	async function convertWildcards(parentCollection: string, fields: string[]) {
		fields = cloneDeep(fields);

		const fieldsInCollection = await getFieldsInCollection(parentCollection);

		const allowedFields = permissions
			? permissions
					.find((permission) => parentCollection === permission.collection)
					?.fields?.split(',')
			: fieldsInCollection;

		if (!allowedFields || allowedFields.length === 0) return [];

		for (let index = 0; index < fields.length; index++) {
			const fieldKey = fields[index];

			if (fieldKey.includes('*') === false) continue;

			if (fieldKey === '*') {
				// Set to all fields in collection
				if (allowedFields.includes('*')) {
					fields.splice(index, 1, ...fieldsInCollection);
				} else {
					// Set to all allowed fields
					fields.splice(index, 1, ...allowedFields);
				}
			}

			// Swap *.* case for *,<relational-field>.*,<another-relational>.*
			if (fieldKey.includes('.') && fieldKey.split('.')[0] === '*') {
				const parts = fieldKey.split('.');

				const relationalFields = allowedFields.includes('*')
					? relations
							.filter(
								(relation) =>
									relation.many_collection === parentCollection ||
									relation.one_collection === parentCollection
							)
							.map((relation) => {
								const isMany = relation.many_collection === parentCollection;
								return isMany ? relation.many_field : relation.one_field;
							})
					: allowedFields.filter((fieldKey) => !!getRelation(parentCollection, fieldKey));

				const nonRelationalFields = fieldsInCollection.filter(
					(fieldKey) => relationalFields.includes(fieldKey) === false
				);

				fields.splice(
					index,
					1,
					...[
						...relationalFields.map((relationalField) => {
							return `${relationalField}.${parts.slice(1).join('.')}`;
						}),
						...nonRelationalFields,
					]
				);
			}
		}

		return fields;
	}

	function getRelation(collection: string, field: string) {
		const relation = relations.find((relation) => {
			return (
				(relation.many_collection === collection && relation.many_field === field) ||
				(relation.one_collection === collection && relation.one_field === field)
			);
		});

		return relation;
	}

	function getRelatedCollection(collection: string, field: string): string | null {
		const relation = getRelation(collection, field);

		if (!relation) return null;

		if (relation.many_collection === collection && relation.many_field === field) {
			return relation.one_collection || null;
		}

		if (relation.one_collection === collection && relation.one_field === field) {
			return relation.many_collection || null;
		}

		return null;
	}

	async function getFieldsInCollection(collection: string) {
		const columns = (await schemaInspector.columns(collection)).map((column) => column.column);
		const fields = [
			...(await knex.select('field').from('directus_fields').where({ collection })).map(
				(field) => field.field
			),
			...systemFieldRows.map((fieldMeta) => fieldMeta.field),
		];

		const fieldsInCollection = [
			...columns,
			...fields.filter((field) => {
				return columns.includes(field) === false;
			}),
		];

		return fieldsInCollection;
	}
}
