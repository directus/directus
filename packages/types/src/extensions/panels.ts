import type { Component, ComponentOptions } from 'vue';
import type { AppField } from '../fields.js';
import type { DeepPartial } from '../misc.js';
import type { Query } from '../query.js';

export type PanelQuery = { collection: string; query: Query; key?: string };

export interface PanelConfig {
	id: string;
	name: string;
	icon: string;
	description?: string;
	query?: (options: Record<string, any>) => PanelQuery | PanelQuery[] | undefined;
	variable?: true; // Mark the panel as a global variable
	component: Component;
	options:
		| DeepPartial<AppField>[]
		| { standard: DeepPartial<AppField>[]; advanced: DeepPartial<AppField>[] }
		| ((
				ctx: Partial<Panel>,
		  ) => DeepPartial<AppField>[] | { standard: DeepPartial<AppField>[]; advanced: DeepPartial<AppField>[] })
		| Exclude<ComponentOptions, any>
		| null;
	minWidth: number;
	minHeight: number;
	skipUndefinedKeys?: string[];
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
