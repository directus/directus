import { Component } from 'vue';
import { Field, LocalType, Type } from './fields';
import { DeepPartial } from './misc';

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

	component: Component;
	options: DeepPartial<Field>[] | Component | null;
	types: readonly Type[];
	localTypes?: readonly LocalType[];
	fields?: string[] | DisplayFieldsFunction;
}
