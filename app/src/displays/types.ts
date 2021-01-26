import VueI18n from 'vue-i18n';
import { Component } from 'vue';
import { Field, localTypes, types } from '@/types';

export type DisplayHandlerFunctionContext = {
	type: string;
};

export type DisplayHandlerFunction = (
	value: any,
	options: any,
	context: DisplayHandlerFunctionContext
) => string | null;

export type DisplayFieldsFunction = (
	options: any,
	context: {
		collection: string;
		field: string;
		type: string;
	}
) => string[];

export type DisplayConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	description?: string | VueI18n.TranslateResult;

	handler: DisplayHandlerFunction | Component;
	options: null | DeepPartial<Field>[] | Component;
	types: readonly typeof types[number][];
	groups?: readonly typeof localTypes[number][];
	fields?: string[] | DisplayFieldsFunction;
};

export type DisplayContext = { i18n: VueI18n };

export type DisplayDefineParam = DisplayConfig | ((context: DisplayContext) => DisplayConfig);
