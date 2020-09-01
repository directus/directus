import VueI18n from 'vue-i18n';

type Translation = {
	locale: string;
	translation: string;
};

export interface CollectionRaw {
	collection: string;
	meta: {
		note: string | null;
		hidden: boolean;
		singleton: boolean;
		icon: string | null;
		translation: Translation[] | null;
		display_template: string | null;
		sort_field: string | null;
		soft_delete_field: string | null;
		soft_delete_value: string | null;
	} | null;
	schema: Record<string, any>;
}

export interface Collection extends CollectionRaw {
	name: string | VueI18n.TranslateResult;
}
