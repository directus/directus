import { FilterOperator } from './filter';

export type AppFilter = {
	key: string;
	field: string;
	operator: FilterOperator;
	value: string;
	locked?: boolean;
};

export type Preset = {
	id?: number;
	bookmark: string | null;
	user: string | null;
	role: string | null;
	collection: string;
	search: string | null;
	filters: readonly AppFilter[] | null;
	layout: string | null;
	layout_query: { [layout: string]: any } | null;
	layout_options: { [layout: string]: any } | null;
	refresh_interval: number | null;
};
