export type Schema = {
	fields: Fields;
};
export type Fields = {
	id: string | number;
	big_integer: string | number;
	boolean: string | number | boolean;
	csv: string | number | string[];
	date: string | number;
	date_time: string | number;
	decimal: string | number;
	float: string | number;
	integer: string | number;
	json: string | number | Record<string, unknown>;
	string: string | number;
	text: string | number;
	time: string | number;
	timestamp: string | number;
	uuid: string;
};
