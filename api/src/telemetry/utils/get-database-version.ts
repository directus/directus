import type { DatabaseClient } from '@directus/types';
import type { Knex } from 'knex';

/**
 * Get the version string of the connected database
 * @param db Knex instance to query against
 * @param driver The database driver/client identifier
 * @returns The database version string, or null if it could not be determined
 */
export async function getDatabaseVersion(db: Knex, driver: DatabaseClient): Promise<string | null> {
	try {
		let row;

		switch (driver) {
			case 'postgres':
			case 'cockroachdb':
			case 'mysql':
				[row] = await db.select(db.raw('version() as version'));
				break;
			case 'sqlite':
				[row] = await db.select(db.raw('sqlite_version() as version'));
				break;
			case 'mssql':
				[row] = await db.select(db.raw('@@VERSION as version'));
				break;
			case 'oracle':
				[row] = await db.select(db.raw('banner as version')).from('v$version').whereRaw("banner like 'Oracle%'");
				break;
			default:
				return db.client?.version ?? null;
		}

		return row?.version ?? null;
	} catch {
		return db.client?.version ?? null;
	}
}
