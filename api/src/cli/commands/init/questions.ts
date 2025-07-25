import path from 'path';
import type { Driver } from '@directus/types';

const filename = ({ filepath }: { filepath: string }): Record<string, string> => ({
	type: 'input',
	name: 'filename',
	message: 'Database File Path:',
	default: path.join(filepath, 'data.db'),
});

const host = (): Record<string, string> => ({
	type: 'input',
	name: 'host',
	message: 'Database Host:',
	default: '127.0.0.1',
});

const port = ({ client }: { client: Exclude<Driver, 'sqlite3'> }): Record<string, any> => ({
	type: 'input',
	name: 'port',
	message: 'Port:',
	default() {
		const ports: Record<Exclude<Driver, 'sqlite3'>, number> = {
			pg: 5432,
			cockroachdb: 26257,
			mysql2: 3306,
			oracledb: 1521,
			mssql: 1433,
		};

		return ports[client];
	},
});

const database = (): Record<string, string> => ({
	type: 'input',
	name: 'database',
	message: 'Database Name:',
	default: 'directus',
});

const user = (): Record<string, string> => ({
	type: 'input',
	name: 'user',
	message: 'Database User:',
});

const password = (): Record<string, string> => ({
	type: 'password',
	name: 'password',
	message: 'Database Password:',
	mask: '*',
});

const encrypt = (): Record<string, string | boolean> => ({
	type: 'confirm',
	name: 'options__encrypt',
	message: 'Encrypt Connection:',
	default: false,
});

const ssl = (): Record<string, string | boolean> => ({
	type: 'confirm',
	name: 'ssl',
	message: 'Enable SSL:',
	default: false,
});

export const databaseQuestions = {
	sqlite3: [filename],
	mysql2: [host, port, database, user, password],
	pg: [host, port, database, user, password, ssl],
	cockroachdb: [host, port, database, user, password, ssl],
	oracledb: [host, port, database, user, password],
	mssql: [host, port, database, user, password, encrypt],
};
