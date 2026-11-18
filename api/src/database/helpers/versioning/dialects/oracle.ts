import { VersioningHelper } from '../types.js';

export class VersioningHelperOracle extends VersioningHelper {
	override getMaxIdentifierLength(): number {
		// https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/Database-Object-Names-and-Qualifiers.html
		return 128;
	}
}
