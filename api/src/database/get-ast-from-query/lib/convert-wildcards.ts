import type { Accountability, Query, SchemaOverview } from '@directus/types';
import { cloneDeep } from 'lodash-es';
import { getAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { getRelation } from '../utils/get-relation.js';

export async function convertWildcards(
	schema: SchemaOverview,
	parentCollection: string,
	fields: string[],
	query: Query,
	accountability: Accountability | null,
) {
	fields = cloneDeep(fields);

	const fieldsInCollection = Object.entries(schema.collections[parentCollection]!.fields).map(([name]) => name);

	let allowedFields: string[] | null = fieldsInCollection;

	if (accountability && accountability.admin !== false) {
		allowedFields = await getAllowedFields(schema, accountability, parentCollection, 'read');
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
								relation.collection === parentCollection || relation.related_collection === parentCollection,
						)
						.map((relation) => {
							const isMany = relation.collection === parentCollection;
							return isMany ? relation.field : relation.meta?.one_field;
						})
				: allowedFields.filter((fieldKey) => !!getRelation(schema, parentCollection, fieldKey));

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
				],
			);
		}
	}

	return fields;
}
