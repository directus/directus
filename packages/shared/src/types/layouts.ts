import { Component } from 'vue';
import { Item } from './items';
import { AppFilter } from './presets';

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
	setup: (props: LayoutProps<Options, Query>, ctx: LayoutContext) => Record<string, unknown>;
}

export interface LayoutProps<Options = any, Query = any> {
	collection: string | null;
	selection: Item[];
	layoutOptions: Options;
	layoutQuery: Query;
	filters: AppFilter[];
	searchQuery: string | null;
	selectMode: boolean;
	readonly: boolean;
	resetPreset?: () => Promise<void>;
}

interface LayoutContext {
	emit: (
		event: 'update:selection' | 'update:layoutOptions' | 'update:layoutQuery' | 'update:filters' | 'update:searchQuery',
		...args: any[]
	) => void;
}

export type LayoutState<T, Options, Query> = {
	props: LayoutProps<Options, Query>;
} & T;
