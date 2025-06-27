import type { Driver } from '@directus/types';

export const drivers: Record<Driver, string> = {
	pg: 'PostgreSQL / Redshift',
	cockroachdb: 'CockroachDB (Beta)',
	mysql2: 'MySQL / MariaDB / Aurora',
	sqlite3: 'SQLite',
	mssql: 'Microsoft SQL Server',
	oracledb: 'Oracle Database',
};

export function getDriverForClient(client: string): Driver | null {
	for (const [key, value] of Object.entries(drivers)) {
		if (value === client) return key as Driver;
	}

	return null;
}
