export const drivers = {
	pg: 'PostgreSQL / Redshift',
	mysql: 'MySQL / MariaDB / Aurora',
	sqlite3: 'SQLite (Beta)',
	oracledb: 'Oracle Database (Alpha)',
	mssql: 'Microsoft SQL Server (Alpha)',
};

export function getDriverForClient(client: string): keyof typeof drivers | null {
	for (const [key, value] of Object.entries(drivers)) {
		if (value === client) return key as keyof typeof drivers;
	}

	return null;
}
