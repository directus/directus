import VueI18n from 'vue-i18n';
import { Component } from 'vue';
import { Field } from '@/stores/fields/types';

const types = [
	'alias',
	'array',
	'boolean',
	'binary',
	'datetime',
	'date',
	'time',
	'file',
	'files',
	'hash',
	'group',
	'integer',
	'decimal',
	'json',
	'lang',
	'm2o',
	'o2m',
	'm2m',
	'slug',
	'sort',
	'status',
	'string',
	'translation',
	'uuid',
	'datetime_created',
	'datetime_updated',
	'user_created',
	'user_updated',
	'user',
] as const;

export type Type = typeof types[number];

export type InterfaceConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	component: Component;
	options: Partial<Field>[] | Component;
	types: Type[];
	hideLabel?: boolean;
	hideLoader?: boolean;
};

export type InterfaceContext = { i18n: VueI18n };

export type InterfaceDefineParam = InterfaceDefineParamGeneric<InterfaceConfig>;

export type InterfaceDefineParamGeneric<T> = T | ((context: InterfaceContext) => T);
