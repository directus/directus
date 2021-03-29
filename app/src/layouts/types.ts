import VueI18n from 'vue-i18n';
import { VueConstructor, Component } from 'vue';
import { Extension } from '@/extension';

export interface LayoutConfig extends Extension {
	icon: string;
	component: Component;
}

export type LayoutContext = { i18n: VueI18n };

export type LayoutDefineParam = LayoutConfig | ((context: LayoutContext) => LayoutConfig);

export interface LayoutComponent extends VueConstructor {
	refresh: () => Promise<void>;
}
