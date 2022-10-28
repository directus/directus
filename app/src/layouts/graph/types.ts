import { Filter } from '@directus/shared/types';

export type LayoutOptions = {
	relationField: string | null;
	fixedPositions: boolean;
	baseColor: string;
	baseSize: number;
	collectionsOptions: Record<string, CollectionOptions>;
};

export interface CollectionOptions {
	displayTemplate: string | null;
	colorField: string | undefined;
	sizeField: string | undefined;
	xField: string | undefined;
	yField: string | undefined;
	filter: FilterOptions[];
}

export type FilterOptions = [
	Filter,
	{
		color: string | undefined;
		size: number | undefined;
	}
];

export type LayoutQuery = {
	fields: string[];
	sort: string[];
	page: number;
	limit: number;
};
