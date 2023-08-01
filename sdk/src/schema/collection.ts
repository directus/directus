import type { MergeCoreCollection } from '../index.js';

export type DirectusCollection<Schema extends object> = {
	collection: string; // TODO keyof complete schema
	meta: MergeCoreCollection<
		Schema,
		'directus_collections',
		{
			collection: string; // TODO keyof complete schema
			icon: string | null;
			note: string | null;
			display_template: string | null;
			hidden: boolean;
			singleton: boolean;
			translations: CollectionMetaTranslationType[] | null;
			archive_field: string | null;
			archive_app_filter: boolean;
			archive_value: string | null;
			unarchive_value: string | null;
			sort_field: string | null;
			accountability: string | null;
			color: string | null;
			item_duplication_fields: string[] | null;
			sort: string | null;
			group: string | null;
			collapse: string;
			preview_url: string | null;
		}
	>;
	schema: {
		schema: string;
		name: string;
		comment: string | null;
	} | null;
};

export type CollectionMetaTranslationType = {
	language: string;
	plural: string;
	singular: string;
	translation: string;
};
