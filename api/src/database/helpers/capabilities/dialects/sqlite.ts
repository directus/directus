import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperSQLite extends CapabilitiesHelper {
	override maxInListSize(): number {
		// SQLITE_MAX_VARIABLE_NUMBER defaults to 32766 since SQLite 3.32.0
		// https://www.sqlite.org/limits.html#max_variable_number
		return 32766;
	}
}
