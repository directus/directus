import path from 'path';

const filename = ({ filepath }: { filepath: string }): Record<string, string> => ({
	type: 'input',
	name: 'filename',
	message: 'Database File Path:',
	default: path.join(filepath, 'data.db'),
});

const connection_string = (): Record<string, string> => ({
	type: 'input',
	name: 'connection_string',
	message: 'Database Connection String:',
});

export const databaseQuestions = {
	sqlite3: [filename],
	mysql: [connection_string],
	pg: [connection_string],
	cockroachdb: [connection_string],
	oracledb: [connection_string],
	mssql: [connection_string],
};
