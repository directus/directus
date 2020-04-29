import VueI18n from 'vue-i18n';
import { Component } from 'vue';
import { Field } from '@/stores/fields/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DisplayHandlerFunction = (value: any, options: any) => string | null;

export type DisplayConfig = {
	id: string;
	icon: string;
	name: string | VueI18n.TranslateResult;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handler: DisplayHandlerFunction | Component;
	options: null | Partial<Field>[] | Component;
	types: string[];
	fields?: string[];
};

export type DisplayContext = { i18n: VueI18n };

export type DisplayDefineParam = DisplayConfig | ((context: DisplayContext) => DisplayConfig);
