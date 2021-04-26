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
	search: string | null;
	title: string | null;
	user: number | null;

	layout_options: Record<string, any>;

	layout_query: Record<string, any>;
	layout: string | null;
};
