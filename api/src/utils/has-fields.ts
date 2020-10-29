import database, { schemaInspector } from '../database';
import { uniq } from 'lodash';
import { systemFieldRows } from '../database/system-data/fields';

export default async function hasFields(fields: { collection: string; field: string }[]) {
	const fieldsObject: { [collection: string]: string[] } = {};

	fields.forEach(({ field, collection }) => {
		if (fieldsObject.hasOwnProperty(collection) === false) {
			fieldsObject[collection] = [];
		}

		fieldsObject[collection].push(field);
	});

	await Promise.all(
		Object.entries(fieldsObject).map(([collection, fields]) =>
			collectionHasFields(collection, fields)
		)
	);
	return true;
}

export async function collectionHasFields(collection: string, fieldKeys: string[]) {
	const [columns, fields] = await Promise.all([
		schemaInspector.columns(collection),
		database
			.select('field')
			.from('directus_fields')
			.where({ collection })
			.whereIn('field', fieldKeys),
	]);

	const existingFields = uniq([
		...columns.map(({ column }) => column),
		...fields.map(({ field }) => field),
		...systemFieldRows
			.filter((fieldMeta) => fieldMeta.collection === collection)
			.map((fieldMeta) => fieldMeta.field),
	]);

	for (const key of fieldKeys) {
		if (existingFields.includes(key) === false) throw new Error(key);
	}
}
