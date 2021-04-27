import VueI18n from 'vue-i18n';

type Translations = {
	language: string;
	translation: string;
	singular: string;
	plural: string;
};

export interface CollectionRaw {
	collection: string;
	meta: {
		note: string | null;
		hidden: boolean;
		singleton: boolean;
		icon: string | null;
		translations: Translations[] | null;
		display_template: string | null;
		sort_field: string | null;
		archive_field: string | null;
		archive_value: string | null;
		unarchive_value: string | null;
		archive_app_filter: boolean;
		accountability: 'all' | 'activity' | null;
	} | null;
	schema: Record<string, any>;
}

export interface Collection extends CollectionRaw {
	name: string | VueI18n.TranslateResult;
}
