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
		single: boolean;
		managed: boolean;
		icon: string | null;
		translation: Translation[] | null;
		display_template: string | null;
	} | null;
	schema: Record<string, any>;
}

export interface Collection extends CollectionRaw {
	name: string | VueI18n.TranslateResult;
}
