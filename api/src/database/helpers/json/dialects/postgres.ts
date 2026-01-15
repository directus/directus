import { JsonHelper } from '../helper.js';

export class JsonHelperPostgres extends JsonHelper {
	protected async checkSupport(): Promise<boolean> {
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
