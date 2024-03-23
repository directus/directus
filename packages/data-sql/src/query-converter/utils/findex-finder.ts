import type { AliasMapping } from '../../types/abstract-sql.js';

export function findIndexForColumn(aliasMapping: AliasMapping, columnName: string): number {
	const foundEntry = aliasMapping.find((aliasMappingEntry) => {
		return aliasMappingEntry.type === 'root' && aliasMappingEntry.alias === columnName;
	});

	if (!foundEntry) throw new Error('No column index found for column name');

	// @ts-ignore the alias type is root, so it has a columnIndex
	return foundEntry.columnIndex;
}
