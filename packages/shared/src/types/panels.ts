import { Component } from 'vue';
import { DeepPartial } from './misc';
import { Field } from './fields';

export interface PanelConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;

	component: Component;
	options: DeepPartial<Field>[] | Component | null;
	minWidth: number;
	minHeight: number;
}
