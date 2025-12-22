export type Driver = 'mysql2' | 'pg' | 'cockroachdb' | 'sqlite3' | 'oracledb' | 'mssql';

export const DatabaseClients = ['mysql', 'postgres', 'cockroachdb', 'sqlite', 'oracle', 'mssql', 'redshift'] as const;
export type DatabaseClient = (typeof DatabaseClients)[number];
