import { JsonHelper } from '../types.js';

export class JsonHelperOracle extends JsonHelper {
	override async supported() {
		// JSON functions were introduced in Oracle Database 12c Release 1 (12.1)
		// Check if JSON_VALUE function is supported
		try {
			await this.knex.raw(`SELECT JSON_VALUE('{"name":"test"}', '$.name') FROM DUAL`);
			return true;
		} catch {
			return false;
		}
	}
}
