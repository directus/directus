export const drivers = {
	pg: 'PostgreSQL / Redshift',
	cockroachdb: 'CockroachDB (Beta)',
	mysql: 'MySQL / MariaDB / Aurora',
	sqlite3: 'SQLite',
	mssql: 'Microsoft SQL Server',
	oracledb: 'Oracle Database',
};

export function getDriverForClient(client: string): keyof typeof drivers | null {
	for (const [key, value] of Object.entries(drivers)) {
		if (value === client) return key as keyof typeof drivers;
	}

	return null;
}
