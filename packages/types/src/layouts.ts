import type { Component } from 'vue';
import type { Filter } from './filter.js';

export interface LayoutConfig {
	id: string;
	name: string;
	icon: string;
	components: {
		default: Component;
		options?: Component;
		actions?: Component;
	};
	smallHeader?: boolean;
	headerShadow?: boolean;
	sidebarShadow?: boolean;
}

export interface LayoutProps<Options = any, Query = any> {
	collection: string | null;
	selection: (number | string)[];
	layoutOptions: Options;
	layoutQuery: Query;
	filterUser: Filter | null;
	filterSystem: Filter | null;
	filter: Filter | null;
	search: string | null;
	selectMode: boolean;
	showSelect: ShowSelect;
	readonly: boolean;
	resetPreset?: () => Promise<void>;
	clearFilters?: () => void;
}

export interface LayoutOptionsProps<Options = any> {
	layoutOptions: Options;
}

export type ShowSelect = 'none' | 'one' | 'multiple';
