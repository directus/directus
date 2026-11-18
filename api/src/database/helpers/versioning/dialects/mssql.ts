import { countBy, mapValues } from 'lodash-es';
import {
	normalizeAction,
	type VersionTableForeignKey,
	type VersionTables,
} from '../../../../services/version-tables/plan-version-tables.js';
import { VersioningHelper } from '../types.js';

const SIZED_NUMBER_TYPES = new Set(['tinyint', 'smallint', 'real']);

export class VersioningHelperMSSQL extends VersioningHelper {
	override getMaxIdentifierLength(): number {
		// https://learn.microsoft.com/en-us/sql/relational-databases/databases/database-identifiers
		return 128;
	}

	override isSizedNumberType(dataType: string): boolean {
		return SIZED_NUMBER_TYPES.has(dataType.toLowerCase());
	}

	override applyForeignKeyRules(tables: VersionTables): VersionTables {
		return mapValues(super.applyForeignKeyRules(tables), (table) => ({
			...table,
			foreignKeys: limitCascadePaths(table.foreignKeys),
		}));
	}
}

/**
 * MSSQL rejects multiple cascade paths, i.e. more than one foreign key with a referential action to the same table.
 * All foreign keys involved in such a conflict lose their actions.
 */
function limitCascadePaths(foreignKeys: VersionTableForeignKey[]): VersionTableForeignKey[] {
	const hasAction = (foreignKey: VersionTableForeignKey) =>
		normalizeAction(foreignKey.on_delete) !== 'NO ACTION' || normalizeAction(foreignKey.on_update) !== 'NO ACTION';

	const actionCounts = countBy(foreignKeys.filter(hasAction), 'foreign_key_table');

	return foreignKeys.map((foreignKey) =>
		hasAction(foreignKey) && actionCounts[foreignKey.foreign_key_table]! > 1
			? { ...foreignKey, on_delete: null, on_update: null }
			: foreignKey,
	);
}
