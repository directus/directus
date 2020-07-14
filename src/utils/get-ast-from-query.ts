/**
 * Generate an AST based on a given collection and query
 */

import { Query } from '../types/query';
import { Relation } from '../types/relation';
import { AST, NestedCollectionAST, FieldAST } from '../types/ast';
import database from '../database';
import * as FieldsService from '../services/fields';

export default async function getASTFromQuery(
	role: string | null,
	collection: string,
	query: Query
): Promise<AST> {
	const ast: AST = {
		type: 'collection',
		name: collection,
		query: query,
		children: [],
	};

	const fields = query.fields || ['*'];

	// Prevent fields from showing up in the query object
	delete query.fields;

	// If no relational fields are requested, we can stop early
	const hasRelations = fields.some((field) => field.includes('.'));

	if (hasRelations === false) {
		fields.forEach((field) => {
			ast.children.push({
				type: 'field',
				name: field,
			});
		});

		return ast;
	}

	// Even though we probably don't need all relations in this request, it's faster to fetch all of them up front
	// and search through the relations in memory than to attempt to read each relation as a single SQL query
	// @TODO look into using graphql/dataloader for this purpose
	const relations = await database.select<Relation[]>('*').from('directus_relations');

	// All collections the current user is allowed to see. This is used to transform the wildcard requests into fields the
	// user is actually allowed to read
	const allowedCollections = (
		await database.select('collection').from('directus_permissions').where({ role })
	).map(({ collection }) => collection);

	ast.children = await parseFields(collection, fields);

	return ast;

	async function parseFields(parentCollection: string, fields: string[]) {
		const children: (NestedCollectionAST | FieldAST)[] = [];

		const relationalStructure: Record<string, string[]> = {};

		// Swap *.* case for *,<relational-field>.*,<another-relational>.*
		for (let index = 0; index < fields.length; index++) {
			const fieldKey = fields[index];

			if (fieldKey.includes('.') === false) continue;

			const parts = fieldKey.split('.');

			if (parts[0] === '*') {
				const availableFields = await FieldsService.fieldsInCollection(parentCollection);

				const relationalFields = availableFields.filter((field) => {
					const relation = getRelation(parentCollection, field);
					if (!relation) return false;

					return (
						allowedCollections.includes(relation.collection_one) &&
						allowedCollections.includes(relation.collection_many)
					);
				});

				const nestedFieldKeys = relationalFields.map(
					(relationalField) => `${relationalField}.${parts.slice(1).join('.')}`
				);

				fields.splice(index, 1, ...nestedFieldKeys);

				fields.push('*');
			}
		}

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
				children: await parseFields(relatedCollection, nestedFields),
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
