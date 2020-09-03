export type Filter = {
	locked?: boolean;
	field: string;
	operator: string;
	value: string | number;
};

export type Preset = {
	id: number;
	collection: string;
	filters: null | Filter[];
	role: number | null;
	search_query: string | null;
	title: string | null;
	user: number | null;

	view_options: Record<string, any>;

	view_query: Record<string, any>;
	view_type: string | null;
};
