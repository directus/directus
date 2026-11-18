import {
	LINK_TABLE_PREFIX,
	SHADOW_TABLE_PREFIX,
	VERSION_REFERENCE_PREFIX,
	VERSION_SYSTEM_FIELDS,
} from './constants.js';

export function isVersioningTable(table: string) {
	return table.startsWith(SHADOW_TABLE_PREFIX) || table.startsWith(LINK_TABLE_PREFIX);
}

export function isVersionSystemField(field: string) {
	return (
		(Object.values(VERSION_SYSTEM_FIELDS) as string[]).includes(field) || field.startsWith(VERSION_REFERENCE_PREFIX)
	);
}
