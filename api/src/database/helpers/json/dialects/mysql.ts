import { JsonHelper } from "../types.js";

export class JsonHelperMySQL extends JsonHelper {
	protected override async checkSupport(): Promise<boolean> {
		// JSON functions were introduced in MySQL 5.7.8 and MariaDB 10.2.7, we support MySQL 8+ and MariaDB 10.2+
		// Check if JSON_EXTRACT function is supported
		try {
			await this.knex.raw(`SELECT JSON_EXTRACT('{"name":"test"}', '$.name') as result`);
			return true;
		} catch {
			return false;
		}
	}
}
