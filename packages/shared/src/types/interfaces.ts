import { Field, LocalType, Type } from './fields';
import { Component } from 'vue';
import { DeepPartial } from './misc';

export interface InterfaceConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;
	component: Component;
	options: DeepPartial<Field>[] | Component;
	types: Type[];
	groups?: LocalType[];
	relational?: boolean;
	hideLabel?: boolean;
	hideLoader?: boolean;
	system?: boolean;
	recommendedDisplays?: string[];
}

export type InterfaceDefineParam = InterfaceDefineParamGeneric<InterfaceConfig>;
export type InterfaceDefineParamGeneric<T> = T | (() => T);
