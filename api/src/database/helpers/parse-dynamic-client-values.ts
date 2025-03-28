import type { DatabaseClient } from '../../types/database.js';

export function parseDynamicValues(client: DatabaseClient, value?: string | number) {
	if (value === 'MAX_COLUMN_NAME_LENGTH') {
		switch (client) {
			case 'oracle':
			case 'mssql':
				return 128;
			default:
				return 64;
		}
	} else if (value === 'MAX_TABLE_NAME_LENGTH') {
		switch (client) {
			case 'oracle':
			case 'mssql':
				return 128;
			default:
				return 64;
		}
	}

	return value;
}
