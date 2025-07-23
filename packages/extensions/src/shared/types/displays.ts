import type { DeepPartial, Field, LocalType, Type } from '@directus/types';
import type { Component, ComponentOptions } from 'vue';
import type { ExtensionOptionsContext } from './options.js';
import type { AppField } from './index.js';

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
