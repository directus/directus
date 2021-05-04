import { Field, localTypes, types } from '@/types';
import { AsyncComponent, Component } from 'vue';
import VueI18n from 'vue-i18n';

export interface InterfaceConfig {
	id: string;
	name: string;
	icon: string;
	description?: string | VueI18n.TranslateResult;
	component: Component | AsyncComponent;
	options: DeepPartial<Field>[] | Component | AsyncComponent;
	types: typeof types[number][];
	groups?: readonly typeof localTypes[number][];
	relational?: boolean;
	hideLabel?: boolean;
	hideLoader?: boolean;
	system?: boolean;
	recommendedDisplays?: string[];
}

export type InterfaceDefineParam = InterfaceDefineParamGeneric<InterfaceConfig>;
export type InterfaceDefineParamGeneric<T> = T | (() => T);
