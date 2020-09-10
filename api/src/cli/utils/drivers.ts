export const drivers = {
	sqlite3: 'SQLite',
	mysql: 'MySQL / MariaDB / Aurora',
	pg: 'PostgreSQL / Redshift',
	oracledb: 'Oracle Database',
	mssql: 'Microsoft SQL Server',
};

export function getDriverForClient(client: string): keyof typeof drivers | null {
	for (const [key, value] of Object.entries(drivers)) {
		if (value === client) return key as keyof typeof drivers;
	}

	return null;
}
