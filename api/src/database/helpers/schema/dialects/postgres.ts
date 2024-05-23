import { useEnv } from '@directus/env';
import { SchemaHelper } from '../types.js';

const env = useEnv();

export class SchemaHelperPostgres extends SchemaHelper {
	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = await this.knex.select(this.knex.raw(`pg_database_size(?) as size;`, [env['DB_DATABASE']]));

			return result[0]?.['size'] ? Number(result[0]?.['size']) : null;
		} catch {
			return null;
		}
	}
}
