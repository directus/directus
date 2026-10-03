export interface Schema {
	fields: Fields[];
}

export interface Fields {
	id: number;
	string: string | null;
	uuid: string | null;
	big_integer: string | number | null;
	integer: number | null;
	float: number | null;
	decimal: string | number | null;
	text: string | null;
	boolean: boolean | null;
	date: string | null;
	time: string | null;
	date_time: string | null;
	timestamp: string | null;
	hash: string | null;
}
