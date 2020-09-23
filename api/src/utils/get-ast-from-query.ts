/**
 * Generate an AST based on a given collection and query
 */

import {
	AST,
	NestedCollectionAST,
	FieldAST,
	Query,
	Relation,
	PermissionsAction,
	Accountability,
} from '../types';
import database from '../database';
import { clone } from 'lodash';
import Knex from 'knex';
import SchemaInspector from 'knex-schema-inspector';

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
	query = clone(query);

	const accountability = options?.accountability;
	const action = options?.action || 'read';
	const knex = options?.knex || database;
	const schemaInspector = SchemaInspector(knex);

	/**
	 * we might not need al this info at all times, but it's easier to fetch it all once, than trying to fetch it for every
	 * requested field. @todo look into utilizing graphql/dataloader for this purpose
	 */
	const relations = await knex.select<Relation[]>('*').from('directus_relations');

	const permissions =
		accountability && accountability.admin !== true
			? await knex
					.select<{ collection: string; fields: string }[]>('collection', 'fields')
					.from('directus_permissions')
					.where({ role: accountability.role, action: action })
			: null;

	const ast: AST = {
		type: 'collection',
		name: collection,
		query: query,
		children: [],
	};

	const fields = query.fields || ['*'];
	const deep = query.deep || {};

	// Prevent fields/deep from showing up in the query object in further use
	delete query.fields;
	delete query.deep;

	ast.children = (await parseFields(collection, fields, deep)).filter(filterEmptyChildCollections);

	return ast;

	function convertWildcards(parentCollection: string, fields: string[]) {
		const allowedFields = permissions
			? permissions
					.find((permission) => parentCollection === permission.collection)
					?.fields?.split(',')
			: ['*'];

		if (!allowedFields || allowedFields.length === 0) return [];

		for (let index = 0; index < fields.length; index++) {
			const fieldKey = fields[index];

			if (fieldKey.includes('*') === false) continue;

			if (fieldKey === '*') {
				if (allowedFields.includes('*')) continue;
				fields.splice(index, 1, ...allowedFields);
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
								const isM2O = relation.many_collection === parentCollection;
								return isM2O ? relation.many_field : relation.one_field;
							})
					: allowedFields.filter((fieldKey) => !!getRelation(parentCollection, fieldKey));

				const nonRelationalFields = allowedFields.filter(
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

	async function parseFields(parentCollection: string, fields: string[], deep?: Record<string, Query>) {
		fields = convertWildcards(parentCollection, fields);

		if (!fields) return [];

		const children: (NestedCollectionAST | FieldAST)[] = [];

		const relationalStructure: Record<string, string[]> = {};

		for (const field of fields) {
			if (field.includes('.') === false) {
				children.push({ type: 'field', name: field });
			} else {
				// field is relational
				const parts = field.split('.');

				if (relationalStructure.hasOwnProperty(parts[0]) === false) {
					relationalStructure[parts[0]] = [];
				}

				relationalStructure[parts[0]].push(parts.slice(1).join('.'));
			}
		}

		for (const [relationalField, nestedFields] of Object.entries(relationalStructure)) {
			const relatedCollection = getRelatedCollection(parentCollection, relationalField);

			if (!relatedCollection) continue;

			const relation = getRelation(parentCollection, relationalField);

			if (!relation) continue;

			const child: NestedCollectionAST = {
				type: 'collection',
				name: relatedCollection,
				fieldKey: relationalField,
				parentKey: await schemaInspector.primary(parentCollection),
				relation: relation,
				query: deep?.[relationalField] || {},
				children: (await parseFields(relatedCollection, nestedFields)).filter(
					filterEmptyChildCollections
				),
			};

			children.push(child);
		}

		return children;
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

	function getRelatedCollection(collection: string, field: string) {
		const relation = getRelation(collection, field);

		if (!relation) return null;

		if (relation.many_collection === collection && relation.many_field === field) {
			return relation.one_collection;
		}

		if (relation.one_collection === collection && relation.one_field === field) {
			return relation.many_collection;
		}
	}

	function filterEmptyChildCollections(childAST: FieldAST | NestedCollectionAST) {
		if (childAST.type === 'collection' && childAST.children.length === 0) return false;
		return true;
	}
}
