import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { parseFilterKey } from '../../../utils/parse-filter-key.js';
import type { Accountability, Query, Relation, SchemaOverview } from '@directus/types';
import { getRelation } from '@directus/utils';
import type { Knex } from 'knex';
import { cloneDeep } from 'lodash-es';

export interface ConvertWildcardsOptions {
	collection: string;
	fields: string[];
	alias: Query['alias'];
	accountability: Accountability | null;
	backlink: boolean | undefined;
}

export interface ConvertWildCardsContext {
	schema: SchemaOverview;
	knex: Knex;
	parentRelation?: Relation;
}

export async function convertWildcards(options: ConvertWildcardsOptions, context: ConvertWildCardsContext) {
	const fields = cloneDeep(options.fields);

	const fieldsInCollection = Object.entries(context.schema.collections[options.collection]!.fields).map(
		([name]) => name,
	);

	let allowedFields: string[] | null = fieldsInCollection;

	if (options.accountability && options.accountability.admin === false) {
		allowedFields = await fetchAllowedFields(
			{
				collection: options.collection,
				action: 'read',
				accountability: options.accountability,
			},
			context,
		);
	}

	if (!allowedFields || allowedFields.length === 0) return [];

	// In case of full read permissions
	if (allowedFields[0] === '*') allowedFields = fieldsInCollection;

	for (let index = 0; index < fields.length; index++) {
		const fieldKey = fields[index]!;

		if (fieldKey.includes('*') === false) continue;

		if (fieldKey === '*') {
			const aliases = Object.keys(options.alias ?? {});

			// Set to all fields in collection
			if (allowedFields.includes('*')) {
				fields.splice(index, 1, ...fieldsInCollection, ...aliases);
			} else {
				// Set to all allowed fields
				const allowedAliases = aliases.filter((fieldKey) => {
					const { fieldName } = parseFilterKey(options.alias![fieldKey]!);
					return allowedFields!.includes(fieldName);
				});

				fields.splice(index, 1, ...allowedFields, ...allowedAliases);
			}
		}

		// Swap *.* case for *,<relational-field>.*,<another-relational>.*
		if (fieldKey.includes('.') && fieldKey.split('.')[0] === '*') {
			const parts = fieldKey.split('.');

			let relationalFields: string[] = [];

			if (allowedFields.includes('*')) {
				relationalFields = context.schema.relations.reduce<string[]>((acc, relation) => {
					if (relation.collection === options.collection && !acc.includes(relation.field)) {
						acc.push(relation.field);
					}

					if (relation.related_collection === options.collection && !acc.includes(relation.meta!.one_field!)) {
						acc.push(relation.meta!.one_field!);
					}

					return acc;
				}, []);
			} else {
				relationalFields = allowedFields.filter(
					(fieldKey) => getRelation(context.schema.relations, options.collection, fieldKey) !== undefined,
				);
			}

			if (options.backlink === false) {
				relationalFields = relationalFields.filter(
					(relationField) =>
						getRelation(context.schema.relations, options.collection, relationField) !== context.parentRelation,
				);
			}

			const nonRelationalFields = allowedFields.filter((fieldKey) => relationalFields.includes(fieldKey) === false);

			const aliasFields = Object.keys(options.alias ?? {}).map((fieldKey) => {
				const name = options.alias![fieldKey];

				if (relationalFields.includes(name!)) {
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
				],
			);
		}
	}

	return fields;
}
