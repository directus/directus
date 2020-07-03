/**
 * Generate an AST based on a given collection and query
 */

import { Query } from '../types/query';
import { Relation } from '../types/relation';
import { AST, NestedCollectionAST, FieldAST } from '../types/ast';
import database from '../database';
import * as FieldsService from '../services/fields';

export default async function getAST(collection: string, query: Query): Promise<AST> {
	const ast: AST = {
		type: 'collection',
		name: collection,
		query: query,
		children: [],
	};

	if (!query.fields) query.fields = ['*'];

	/** @todo support wildcard */
	const fields = query.fields;

	// If no relational fields are requested, we can stop early
	const hasRelations = query.fields.some((field) => field.includes('.'));
	if (hasRelations === false) {
		fields.forEach((field) => {
			ast.children.push({
				type: 'field',
				name: field,
			});
		});

		return ast;
	}

	// Even though we might not need all records from relations, it'll be faster to load all records
	// into memory once and search through it in JS than it would be to do individual queries to fetch
	// this data field by field
	const relations = await database.select<Relation[]>('*').from('directus_relations');

	ast.children = await parseFields(collection, query.fields);

	return ast;

	async function parseFields(parentCollection: string, fields: string[]) {
		const children: (NestedCollectionAST | FieldAST)[] = [];

		const relationalStructure: Record<string, string[]> = {};

		// Swap *.* case for *,<relational-field>.*
		for (let i = 0; i < fields.length; i++) {
			const fieldKey = fields[i];

			if (fieldKey.includes('.') === false) continue;

			const parts = fieldKey.split('.');

			if (parts[0] === '*') {
				const availableFields = await FieldsService.fieldsInCollection(parentCollection);
				fields.splice(
					i,
					1,
					...availableFields
						.filter((field) => !!getRelation(parentCollection, field))
						.map((field) => `${field}.${parts.slice(1).join('.')}`)
				);
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
