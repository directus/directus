import type {
	CollectionName,
	DirectusField,
	MergeCoreCollection,
	NestedPartial,
	StringLiteralUnion,
} from '../index.js';

export type DirectusCollection<Schema = any> = {
	collection: CollectionName<Schema>;
	meta: MergeCoreCollection<
		Schema,
		'directus_collections',
		{
			collection: CollectionName<Schema>;
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
			accountability: StringLiteralUnion<'all' | 'activity'> | null;
			color: string | null;
			item_duplication_fields: string[] | null;
			sort: number | null;
			group: string | null;
			collapse: StringLiteralUnion<'open' | 'closed' | 'locked'>;
			preview_url: string | null;
			versioning: boolean;
			status: StringLiteralUnion<'active' | 'inactive'>;
			autosave_revision_interval: number | null;
			// Only true for injected system-collection rows; the GET /collections response never sets it to false.
			// @directus/types' CollectionMeta.system is `boolean | null` because it also covers schema diff/apply, which does.
			system?: true;
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
