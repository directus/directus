import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperMySQL extends CapabilitiesHelper {
	override supportsColumnPositionInGroupBy(): boolean {
		// Supported in MySQL https://dev.mysql.com/doc/refman/8.4/en/select.html#id756773
		// > Columns selected for output can be referred to in ORDER BY and GROUP BY clauses using column names,
		//   column aliases, or column positions. Column positions are integers and begin with 1:
		return true;
	}

	protected override async checkJsonSupport(): Promise<boolean> {
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
