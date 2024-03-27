export type MSSQLError = {
	message: string;
	code: 'EREQUEST';
	number: number;
	state: number;
	class: number;
	serverName: string;
	procName: string;
	lineNumber: number;
};

export type MySQLError = {
	message: string;
	code: string;
	errno: number;
	sqlMessage: string;
	sqlState: string;
	index: number;
	sql: string;
};

export type PostgresError = {
	message: string;
	length: number;
	code: string;
	detail: string;
	schema: string;
	table: string;
	column?: string;
	dataType?: string;
	constraint?: string;
};

export type OracleError = {
	message: string;
	errorNum: number;
	offset: number;
};

export type SQLiteError = {
	message: string;
	errno: number;
	code: string;
};

export type SQLError = MSSQLError & MySQLError & PostgresError & SQLiteError & OracleError & Error;
