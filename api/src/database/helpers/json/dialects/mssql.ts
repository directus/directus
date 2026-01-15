import { JsonHelper } from '../types.js';

export class JsonHelperMSSQL extends JsonHelper {
	protected override async checkSupport(): Promise<boolean> {
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
