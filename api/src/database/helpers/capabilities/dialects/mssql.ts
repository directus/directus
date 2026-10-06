import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMSSQL extends CapabilitiesHelper {
	override maxInListSize(): number {
		// SQL Server supports a maximum of 2100 parameters per request
		// https://learn.microsoft.com/en-us/sql/sql-server/maximum-capacity-specifications-for-sql-server
		return 2100;
	}
}
