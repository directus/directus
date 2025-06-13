import type { DeepPartial, LocalType, Type } from '@directus/types';
import type { Component, ComponentOptions } from 'vue';
import type { ExtensionOptionsContext } from './options.js';
import type { AppField } from './index.js';

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
	autoKey?: boolean;
	system?: boolean;
	recommendedDisplays?: string[];
	preview?: string;
}
