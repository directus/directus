import { Component, ComponentOptions } from 'vue';
import { Field, LocalType, Type } from './fields';
import { DeepPartial } from './misc';

export type DisplayHandlerFunctionContext = {
	type: string;
};

export type DisplayHandlerFunction = (
	value: any,
	options: Record<string, any> | null,
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

	handler: DisplayHandlerFunction | ComponentOptions;
	options: DeepPartial<Field>[] | Component | null;
	types: readonly Type[];
	groups?: readonly LocalType[];
	fields?: string[] | DisplayFieldsFunction;
}
