import { Filter } from '@directus/shared/types';

export type PanelQuery = {
	aggregate?: Record<string, string[]>;
	groupBy?: string;
	fields?: string[];
	filter?: Filter;
	limit?: number;
};
