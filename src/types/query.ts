export type Query = {
	fields?: string[];
	sort?: Sort[];
};

export type Sort = {
	column: string;
	order: 'asc' | 'desc';
};
