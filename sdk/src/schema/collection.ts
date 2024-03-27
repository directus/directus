import type { DirectusField, MergeCoreCollection, NestedPartial } from '../index.js';

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
			sort: number | null;
			group: string | null;
			collapse: string;
			preview_url: string | null;
			versioning: boolean;
		}
	>;
	schema:
		| ({
				name: string;
				comment: string | null;
		  } & Record<string, unknown>)
		| null;
	fields?: NestedPartial<DirectusField<Schema>>[];
};

export type CollectionMetaTranslationType = {
	language: string;
	plural: string;
	singular: string;
	translation: string;
};
