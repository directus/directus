import { Field, LocalType, Type } from './fields';
import { Component } from 'vue';
import { DeepPartial } from './misc';

export interface InterfaceConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;
	component: Component;
	options: DeepPartial<Field>[] | Component | null;
	types: readonly Type[];
	groups?: readonly LocalType[];
	relational?: boolean;
	hideLabel?: boolean;
	hideLoader?: boolean;
	system?: boolean;
	recommendedDisplays?: string[];
}
