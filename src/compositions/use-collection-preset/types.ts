export type Filter = {
	locked?: boolean;
	field: string;
	operator: string;
	value: string | number;
};
