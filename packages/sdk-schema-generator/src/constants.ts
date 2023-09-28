// Built-in typescript types used in the schema
export enum TypeScriptTypes {
	STRING = 'string',
	NUMBER = 'number',
	BOOL = 'boolean',
}

// Literal types for specific field types
export enum TypeLiterals {
	DATETIME = "'datetime'",
	JSON = "'json'",
	CSV = "'csv'",
}

/**
 * Database type to TS Schema type translation map
 */
export const fieldTypeMap: Record<string, TypeScriptTypes | TypeLiterals> = {
	string: TypeScriptTypes.STRING,
	bigInteger: TypeScriptTypes.STRING,
	boolean: TypeScriptTypes.BOOL,
	date: TypeLiterals.DATETIME,
	dateTime: TypeLiterals.DATETIME,
	decimal: TypeScriptTypes.NUMBER,
	float: TypeScriptTypes.NUMBER,
	integer: TypeScriptTypes.NUMBER,
	json: TypeLiterals.JSON,
	csv: TypeLiterals.CSV,
	text: TypeScriptTypes.STRING,
	time: TypeLiterals.DATETIME,
	timestamp: TypeLiterals.DATETIME,
	uuid: TypeScriptTypes.STRING,
	hash: TypeScriptTypes.STRING,
};
