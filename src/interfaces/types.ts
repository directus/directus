import VueI18n from 'vue-i18n';
import { Component } from 'vue';
import { Field } from '@/stores/fields/types';

export type InterfaceConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	component: Component;
	options: Partial<Field>[] | Component;
};

export type InterfaceContext = { i18n: VueI18n };

export type InterfaceDefineParam =
	| InterfaceConfig
	| ((context: InterfaceContext) => InterfaceConfig);
