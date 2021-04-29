import VueI18n from 'vue-i18n';
import { VueConstructor, Component } from 'vue';

export interface LayoutConfig {
	id: string;
	name: string;
	icon: string;
	component: Component;
}

export type LayoutContext = Record<string, any>;

export type LayoutDefineParam = LayoutConfig | ((context: LayoutContext) => LayoutConfig);

export interface LayoutComponent extends VueConstructor {
	refresh: () => Promise<void>;
}
