import type { ExtensionOptionsContext } from './options.js';
import type { AppField, LocalType, Type } from '../fields.js';
import type { DeepPartial } from '../misc.js';
import type { Component, ComponentOptions } from 'vue';

export interface InterfaceConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;
	component: Component;
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
	group?: 'standard' | 'selection' | 'relational' | 'presentation' | 'group' | 'other';
	order?: number;
	relational?: boolean;
	hideLabel?: boolean;
	hideLoader?: boolean;
	indicatorStyle?: 'active' | 'hidden' | 'muted';
	autoKey?: boolean;
	system?: boolean;
	recommendedDisplays?: string[];
	preview?: string;
}
