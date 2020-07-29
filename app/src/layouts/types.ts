import VueI18n from 'vue-i18n';
import { VueConstructor, Component } from 'vue';

export type LayoutConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	component: Component;
};

export type LayoutContext = { i18n: VueI18n };

export type LayoutDefineParam = LayoutConfig | ((context: LayoutContext) => LayoutConfig);

export interface LayoutComponent extends VueConstructor {
	refresh: () => Promise<void>;
}
