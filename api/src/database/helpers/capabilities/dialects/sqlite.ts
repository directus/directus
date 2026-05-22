import { CapabilitiesHelperDefault } from './default.js';

/**
 * SQLite gained `INSERT … RETURNING` in 3.35.0 (2021-03-12). Below that version the only
 * id available after an insert is `last_insert_rowid()` (the last item only), so the
 * batch path can't be trusted. Probe the runtime version once per knex client.
 * https://www.sqlite.org/lang_returning.html
 */
const MIN_SQLITE_RETURNING_VERSION: [number, number] = [3, 35];

export class CapabilitiesHelperSqlite extends CapabilitiesHelperDefault {
	private preservesOrderCache?: boolean;

	override async preservesInsertOrderInReturning(): Promise<boolean> {
		if (this.preservesOrderCache !== undefined) return this.preservesOrderCache;

		const row = await this.knex.select(this.knex.raw('sqlite_version() as version')).first<{ version?: string }>();
		const versionStr = String(row?.version ?? '0');
		const [major = 0, minor = 0] = versionStr.split('.').map(Number);
		const [minMajor, minMinor] = MIN_SQLITE_RETURNING_VERSION;

		this.preservesOrderCache = major > minMajor || (major === minMajor && minor >= minMinor);
		return this.preservesOrderCache;
	}
}
