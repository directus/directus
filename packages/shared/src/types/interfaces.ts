import type { Field, LocalType, Type } from './fields.js';
import type { Component, ComponentOptions } from 'vue';
import type { DeepPartial } from './misc.js';
import type { ExtensionOptionsContext } from './extensions.js';

export interface InterfaceConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;

	component: Component;
	options:
		| DeepPartial<Field>[]
		| { standard: DeepPartial<Field>[]; advanced: DeepPartial<Field>[] }
		| ((
				ctx: ExtensionOptionsContext
		  ) => DeepPartial<Field>[] | { standard: DeepPartial<Field>[]; advanced: DeepPartial<Field>[] })
		| ComponentOptions
		| null;
	types: readonly Type[];
	localTypes?: readonly LocalType[];
	group?: 'standard' | 'selection' | 'relational' | 'presentation' | 'presentation' | 'group' | 'other';
	order?: number;
	relational?: boolean;
	hideLabel?: boolean;
	hideLoader?: boolean;
	system?: boolean;
	recommendedDisplays?: string[];
	preview?: string;
}
