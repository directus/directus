import type { Component, ComponentOptions } from 'vue';
import type { AppField, LocalType, Type } from '../fields.js';
import type { DeepPartial } from '../misc.js';
import type { ExtensionOptionsContext } from './options.js';

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
	/**
	 * Pre-fill the field key with this value when the interface is selected during field creation.
	 * Only applied while the key is still empty, so it never overwrites a key the user entered.
	 * Useful for interfaces that are conventionally always used with the same field key.
	 */
	suggestedKey?: string;
	system?: boolean;
	recommendedDisplays?: string[];
	preview?: string;
}
