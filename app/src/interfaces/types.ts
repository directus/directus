import VueI18n from 'vue-i18n';
import { Component } from 'vue';
import { Field, types, localTypes } from '@/types';

export type InterfaceConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	description?: string | VueI18n.TranslateResult;
	component: Component;
	options: DeepPartial<Field>[] | Component;
	types: typeof types[number][];
	groups?: readonly typeof localTypes[number][];
	relational?: boolean;
	hideLabel?: boolean;
	hideLoader?: boolean;
	system?: boolean;
	recommendedDisplays?: string[];
};

export type InterfaceContext = { i18n: VueI18n };
export type InterfaceDefineParam = InterfaceDefineParamGeneric<InterfaceConfig>;
export type InterfaceDefineParamGeneric<T> = T | ((context: InterfaceContext) => T);
