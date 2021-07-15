import { DeepPartial, Field, LocalType, Type } from '@directus/shared/types';
import { Component } from 'vue';

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
	types: Type[];
	groups?: LocalType[];
	fields?: string[] | DisplayFieldsFunction;
}

export type DisplayDefineParam = DisplayConfig | (() => DisplayConfig);
