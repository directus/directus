import type { Driver } from '../../types/index.js';

export const drivers: Record<Driver, string> = {
	pg: 'PostgreSQL / Redshift',
	cockroachdb: 'CockroachDB (Beta)',
	mysql: 'MySQL / MariaDB / Aurora',
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
