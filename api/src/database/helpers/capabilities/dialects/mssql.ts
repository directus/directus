import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMSSQL extends CapabilitiesHelper {
	override getMaxBindings(): number {
		// 2100 minus the two parameters taken by sp_executesql (@stmt and @params)
		// https://learn.microsoft.com/en-us/sql/sql-server/maximum-capacity-specifications-for-sql-server
		return 2098;
	}
}
