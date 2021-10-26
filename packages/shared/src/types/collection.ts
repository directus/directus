import { Table } from 'knex-schema-inspector/dist/types/table';

type Translations = {
	language: string;
	translation: string;
	singular: string;
	plural: string;
};

export type CollectionMeta = {
	collection: string;
	note: string | null;
	hidden: boolean;
	singleton: boolean;
	icon: string | null;
	color: string | null;
	translations: Translations[] | null;
	display_template: string | null;
	sort_field: string | null;
	archive_field: string | null;
	archive_value: string | null;
	unarchive_value: string | null;
	archive_app_filter: boolean;
	item_duplication_fields: string[] | null;
	accountability: 'all' | 'activity' | null;
	sort: number | null;
	group: string | null;
	collapse: 'open' | 'closed' | 'locked';
};

export interface Collection {
	collection: string;
	meta: CollectionMeta | null;
	schema: Table | null;
}

export type CollectionType = 'alias' | 'table' | 'unknown';
