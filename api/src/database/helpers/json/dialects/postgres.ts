import { JsonHelper } from '../types.js';

export class JsonHelperPostgres extends JsonHelper {
	override async supported() {
		// JSON functions were introduced in PostgreSQL 9.2, JSONB in 9.4
		// Check if -> and ->> operators are supported
		try {
			await this.knex.raw(`SELECT '{"name":"test"}'::jsonb ->> 'name' as result`);
			return true;
		} catch {
			return false;
		}
	}
}
