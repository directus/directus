import { SharedHelper } from '../types.js';
import { exec } from '../utils.js';

/**
 * Oracle has no databases, every sandbox gets a schema (user) inside of the pluggable database instead.
 * There is no template, as Data Pump takes longer than bootstrapping.
 */
export class SharedHelperOracle extends SharedHelper {
	readonly port = 1521;
	override readonly supportsTemplates = false;

	override databaseName() {
		return this.admin.DB_DATABASE;
	}

	async createUser(user: string, password: string, name: string) {
		// Same helper the image uses to create the default app user
		await exec('docker', ['exec', this.container, 'createAppUser', user, password, name]);
	}

	override async drop(user: string) {
		// Open sessions prevent the user from being dropped
		await this.sqlplus([
			'BEGIN',
			`FOR s IN (SELECT sid, serial# AS serial FROM v$session WHERE username = UPPER('${user}')) LOOP`,
			"EXECUTE IMMEDIATE 'ALTER SYSTEM KILL SESSION ''' || s.sid || ',' || s.serial || ''' IMMEDIATE';",
			'END LOOP;',
			`EXECUTE IMMEDIATE 'DROP USER ${user} CASCADE';`,
			// ORA-01918: user does not exist
			'EXCEPTION WHEN OTHERS THEN IF SQLCODE != -1918 THEN RAISE; END IF;',
			'END;',
			'/',
		]);
	}

	/** Run statements as sysdba inside of the pluggable database */
	private async sqlplus(lines: string[]) {
		const script = [
			'WHENEVER SQLERROR EXIT SQL.SQLCODE',
			`ALTER SESSION SET CONTAINER=${this.admin.DB_DATABASE};`,
			...lines,
			'exit;',
			'',
		].join('\n');

		await exec('docker', ['exec', '-i', this.container, 'sqlplus', '-s', '/', 'as', 'sysdba'], script);
	}
}
