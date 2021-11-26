import { Filter } from './filter';

export type Preset = {
	id?: number;
	bookmark: string | null;
	user: string | null;
	role: string | null;
	collection: string;
	search: string | null;
	filter: Filter | null;
	layout: string | null;
	layout_query: { [layout: string]: any } | null;
	layout_options: { [layout: string]: any } | null;
	refresh_interval: number | null;
};
