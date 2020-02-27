import { Component } from 'vue';
import VueI18n from 'vue-i18n';

export type LayoutOptions = {
	id: string;
	register: (context: LayoutContext) => LayoutConfig;
};

export interface LayoutConfig {
	icon: string;
	name: string | VueI18n.TranslateResult;
	component: Component;
}

export interface Layout extends LayoutConfig {
	id: string;
}

export type LayoutContext = { i18n: VueI18n };
