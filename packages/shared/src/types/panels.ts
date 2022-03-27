import { Component, ComponentOptions } from 'vue';
import { DeepPartial } from './misc';
import { Field } from './fields';

export interface PanelConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;

	component: Component;
	options:
		| DeepPartial<Field>[]
		| { standard: DeepPartial<Field>[]; advanced: DeepPartial<Field>[] }
		| ((
				ctx: Partial<Panel>
		  ) => DeepPartial<Field>[] | { standard: DeepPartial<Field>[]; advanced: DeepPartial<Field>[] })
		| ComponentOptions
		| null;
	minWidth: number;
	minHeight: number;
}

export type Panel = {
	id: string;
	dashboard: string;
	show_header: boolean;
	name: string;
	icon: string;
	color: string;
	note: string;
	type: string;
	position_x: number;
	position_y: number;
	width: number;
	height: number;
	options: Record<string, any>;
	date_created: string;
	user_created: string;
};
