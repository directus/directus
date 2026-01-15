import { CapabilitiesHelper } from '../types.js';

export class CapabilitiesHelperOracle extends CapabilitiesHelper {
	protected override async checkJsonSupport(): Promise<boolean> {
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
