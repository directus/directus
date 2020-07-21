const filename = () => ({
	type: 'input',
	name: 'filename',
	message: 'Filename:',
	default: './data.db',
});

const host = () => ({
	type: 'input',
	name: 'host',
	message: 'Host:',
	default: '127.0.0.1',
});

const port = ({ client }: { client: string }) => ({
	type: 'input',
	name: 'port',
	message: 'Port:',
	default() {
		const ports: Record<string, number> = {
			pg: 5432,
			mysql: 3306,
			oracledb: 1521,
			mssql: 1433,
		};

		return ports[client];
	},
});

const database = () => ({
	type: 'input',
	name: 'database',
	message: 'Database Name:',
	default: 'directus',
});

const username = () => ({
	type: 'input',
	name: 'username',
	message: 'Username:',
});

const password = () => ({
	type: 'password',
	name: 'password',
	message: 'Password:',
	mask: '*',
});

export const databaseQuestions = {
	sqlite3: [filename],
	mysql: [host, port, database, username, password],
	pg: [host, port, database, username, password],
	oracledb: [host, port, database, username, password],
	mssql: [host, port, database, username, password],
};
