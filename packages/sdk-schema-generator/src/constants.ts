/**
 *
 */
export const fieldTypeMap = new Map<string, string>(Object.entries({
	string: 'string',
	bigInteger: 'string',
	boolean: 'boolean',
	date: "'datetime'",
	dateTime: "'datetime'",
	decimal: 'number',
	float: 'number',
	integer: 'number',
	json: "'json'",
	text: 'string',
	time: "'datetime'",
	timestamp: "'datetime'",
	uuid: 'string',
	hash: 'string',
}));
