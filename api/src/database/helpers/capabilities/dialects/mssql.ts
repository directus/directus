import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMSSQL extends CapabilitiesHelper {
	protected override async checkJsonSupport(): Promise<boolean> {
		// JSON functions were introduced in SQL Server 2016 (version 13.0)
		// Check if JSON_VALUE function is supported
		try {
			await this.knex.raw(`SELECT JSON_VALUE('{"name":"test"}', '$.name') as result`);
			return true;
		} catch {
			return false;
		}
	}
}
