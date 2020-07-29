import { Column } from 'knex-schema-inspector/dist/types/column';
import getLocalType from './get-local-type';

export default function getDefaultValue(column: Column) {
	const type = getLocalType(column.type);

	let defaultValue = column.default_value || null;

	if (defaultValue === null) return null;

	// Check if the default is wrapped in an extra pair of quotes, this happens in SQLite
	if (
		typeof defaultValue === 'string' &&
		defaultValue.startsWith(`'`) &&
		defaultValue.endsWith(`'`)
	) {
		defaultValue = defaultValue.slice(1, -1);
	}

	switch (type) {
		case 'bigInteger':
		case 'integer':
		case 'decimal':
		case 'float':
			return Number(defaultValue);
		case 'boolean':
			return !!Number(defaultValue);
		default:
			return defaultValue;
	}
}
