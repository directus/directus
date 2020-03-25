import VueI18n from 'vue-i18n';
import { Component } from 'vue';

export type InterfaceConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	component: Component;
};

export type InterfaceContext = { i18n: VueI18n };

export type InterfaceDefineParam =
	| InterfaceConfig
	| ((context: InterfaceContext) => InterfaceConfig);
