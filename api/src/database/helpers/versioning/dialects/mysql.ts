import { VersioningHelper } from '../types.js';

const SIZED_NUMBER_TYPES = new Set(['tinyint', 'smallint', 'mediumint', 'double']);

export class VersioningHelperMySQL extends VersioningHelper {
	override getMaxIdentifierLength(): number {
		// https://dev.mysql.com/doc/refman/8.4/en/identifier-length.html
		return 64;
	}

	override isSizedNumberType(dataType: string): boolean {
		return SIZED_NUMBER_TYPES.has(dataType.toLowerCase());
	}
}
