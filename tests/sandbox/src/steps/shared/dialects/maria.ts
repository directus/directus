import { SharedHelperMySQL } from './mysql.js';

export class SharedHelperMaria extends SharedHelperMySQL {
	protected override readonly dumpCommand = 'mariadb-dump';
	protected override readonly clientCommand = 'mariadb';
}
