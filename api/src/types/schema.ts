import { Relation } from './relation';
import { Permission } from './permissions';
import { types } from './field';

type CollectionsOverview = {
	[name: string]: {
		collection: string;
		primary: string;
		singleton: boolean;
		sortField: string | null;
		note: string | null;
		accountability: 'all' | 'activity' | null;
		fields: {
			[name: string]: {
				field: string;
				defaultValue: any;
				nullable: boolean;
				type: typeof types[number] | 'unknown' | 'alias';
				precision: number | null;
				scale: number | null;
				special: string[];
				note: string | null;
				alias: boolean;
			};
		};
	};
};

export type SchemaOverview = {
	collections: CollectionsOverview;
	relations: Relation[];
	permissions: Permission[];
};
