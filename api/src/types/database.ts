export type Driver = 'mysql' | 'pg' | 'cockroachdb' | 'sqlite3' | 'oracledb' | 'mssql';

export const DatabaseClients = ['mysql', 'postgres', 'cockroachdb', 'sqlite', 'oracle', 'mssql', 'redshift'] as const;
export type DatabaseClient = (typeof DatabaseClients)[number];

export const DatabaseVersionedClients = [
	'postgres12',
	'oracle12',
	'mysql5',
	'mysql8',
	'mariadb',
	'mssql13',
	'sqlite',
	'fallback',
] as const;
export type DatabaseVersionedClient = (typeof DatabaseVersionedClients)[number];
