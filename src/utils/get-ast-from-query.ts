/**
 * Generate an AST based on a given collection and query
 */

import { Relation } from '../types/relation';
import { AST, NestedCollectionAST, FieldAST, Query } from '../types';
import database, { schemaInspector } from '../database';
import * as FieldsService from '../services/fields';

export default async function getASTFromQuery(
	role: string | null,
	collection: string,
	query: Query
): Promise<AST> {
	/**
	 * we might not need al this info at all times, but it's easier to fetch it all once, than trying to fetch it for every
	 * requested field. @todo look into utilizing graphql/dataloader for this purpose
	 */
	const permissions = await database
		.select<{ collection: string; fields: string }[]>('collection', 'fields')
		.from('directus_permissions')
		.where({ role, operation: 'read' });
	const relations = await database.select<Relation[]>('*').from('directus_relations');

	const ast: AST = {
		type: 'collection',
		name: collection,
		query: query,
		children: [],
	};

	const fields = convertWildcards(collection, query.fields || ['*']);

	// Prevent fields from showing up in the query object
	delete query.fields;

	ast.children = parseFields(collection, fields);

	return ast;

	function convertWildcards(parentCollection: string, fields: string[]) {
		const allowedFields = permissions
			.find((permission) => parentCollection === permission.collection)
			?.fields?.split(',');

		for (let index = 0; index < fields.length; index++) {
			const fieldKey = fields[index];

			if (fieldKey.includes('*') === false) continue;

			if (fieldKey === '*') {
				fields.splice(index, 1, ...allowedFields);
			}

			// Swap *.* case for *,<relational-field>.*,<another-relational>.*
			if (fieldKey.includes('.') && fieldKey.split('.')[0] === '*') {
				const parts = fieldKey.split('.');
				const relationalFields = allowedFields.filter(
					(fieldKey) => !!getRelation(parentCollection, fieldKey)
				);
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

	function parseFields(parentCollection: string, fields: string[]) {
		fields = convertWildcards(parentCollection, fields);

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

			const child: NestedCollectionAST = {
				type: 'collection',
				name: relatedCollection,
				fieldKey: relationalField,
				parentKey: 'id' /** @todo this needs to come from somewhere real */,
				relation: getRelation(parentCollection, relationalField),
				query: {} /** @todo inject nested query here */,
				children: parseFields(relatedCollection, nestedFields),
			};

			children.push(child);
		}

		return children;
	}

	function getRelation(collection: string, field: string) {
		const relation = relations.find((relation) => {
			return (
				(relation.collection_many === collection && relation.field_many === field) ||
				(relation.collection_one === collection && relation.field_one === field)
			);
		});

		return relation;
	}

	function getRelatedCollection(collection: string, field: string) {
		const relation = getRelation(collection, field);

		if (!relation) return null;

		if (relation.collection_many === collection && relation.field_many === field) {
			return relation.collection_one;
		}

		if (relation.collection_one === collection && relation.field_one === field) {
			return relation.collection_many;
		}
	}
}
