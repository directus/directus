import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMySQL extends CapabilitiesHelper {
	override supportsAliasInGroupBy(): boolean {
		// Supported in MySQL https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html
		return true;
	}
}
