import VueI18n from 'vue-i18n';

type Translation = {
	locale: string;
	translation: string;
};

export interface CollectionRaw {
	collection: string;
	system: {
		note: string | null;
		hidden: boolean;
		single: boolean;
		managed: boolean;
		icon: string | null;
		translation: Translation[] | null;
		display_template: string | null;
	} | null;
	database: Record<string, any>:
}

export interface Collection extends CollectionRaw {
	name: string | VueI18n.TranslateResult;
}
