import { Filter } from '@directus/shared/types';

export type Preset = {
	id: number;
	collection: string;
	filter: Filter | null;
	role: number | null;
	search: string | null;
	title: string | null;
	user: number | null;

	layout_options: Record<string, any>;

	layout_query: Record<string, any>;
	layout: string | null;
};
