import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperSQLite extends CapabilitiesHelper {
	override getMaxBindings(): number {
		// https://www.sqlite.org/limits.html#max_variable_number
		return 32766;
	}
}
