import type { Component, ComponentOptions } from 'vue';
import type { AppField, Field, LocalType, Type } from '../fields.js';
import type { DeepPartial } from '../misc.js';
import type { ExtensionOptionsContext } from './options.js';

export type DisplayFieldsFunction = (
	options: any,
	context: {
		collection: string;
		field: string;
		type: string;
	},
) => string[];

export interface DisplayConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;

	component: Component;
	handler?: (
		value: any,
		options: Record<string, any>,
		ctx: { interfaceOptions?: Record<string, any>; field?: Field; collection?: string },
	) => string | null;
	options:
		| DeepPartial<AppField>[]
		| { standard: DeepPartial<AppField>[]; advanced: DeepPartial<AppField>[] }
		| ((
				ctx: ExtensionOptionsContext,
		  ) => DeepPartial<AppField>[] | { standard: DeepPartial<AppField>[]; advanced: DeepPartial<AppField>[] })
		| Exclude<ComponentOptions, any>
		| null;
	types: readonly Type[];
	localTypes?: readonly LocalType[];
	fields?: string[] | DisplayFieldsFunction;
}
