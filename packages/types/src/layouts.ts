import type { Component } from 'vue';
import type { Filter } from './filter.js';

export interface LayoutConfig<Options = any, Query = any> {
	id: string;
	name: string;
	icon: string;

	component: Component;
	slots: {
		options: Component;
		sidebar: Component;
		actions: Component;
	};
	smallHeader?: boolean;
	headerShadow?: boolean;
	sidebarShadow?: boolean;
	setup: (props: LayoutProps<Options, Query>, ctx: LayoutContext) => Record<string, unknown>;
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

interface LayoutContext {
	emit: (event: 'update:selection' | 'update:layoutOptions' | 'update:layoutQuery', ...args: any[]) => void;
}

export type LayoutState<T, Options, Query> = {
	props: LayoutProps<Options, Query>;
} & T;

export type ShowSelect = 'none' | 'one' | 'multiple';
