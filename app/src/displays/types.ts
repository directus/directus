import { Component } from 'vue';
import { Field, localTypes, types } from '@/types';

export type DisplayHandlerFunctionContext = {
	type: string;
};

export type DisplayHandlerFunction = (
	value: any,
	options: any,
	context?: DisplayHandlerFunctionContext
) => string | null;

export type DisplayFieldsFunction = (
	options: any,
	context: {
		collection: string;
		field: string;
		type: string;
	}
) => string[];

export interface DisplayConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;

	// eslint-disable-next-line @typescript-eslint/ban-types
	handler: DisplayHandlerFunction | Component | Function;
	options: null | DeepPartial<Field>[] | Component;
	types: readonly typeof types[number][];
	groups?: readonly typeof localTypes[number][];
	fields?: string[] | DisplayFieldsFunction;
}

export type DisplayDefineParam = DisplayConfig | (() => DisplayConfig);
