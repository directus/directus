export const drivers = [
	{ value: 'pg', name: 'PostgreSQL / Redshift' },
	{ value: 'mysql', name: 'MySQL / MariaDB / Aurora' },
	{ value: 'sqlite3', name: 'SQLite' },
	{ value: 'mssql', name: 'Microsoft SQL Server' },
	{ value: 'oracledb', name: 'Oracle Database (Alpha)' },
] as const;

export type Client = typeof drivers[number]['value'];
