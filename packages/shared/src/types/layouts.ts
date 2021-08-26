import { Component } from 'vue';
import { Item } from './items';
import { AppFilter } from './presets';

export interface LayoutConfig<Options = any, Query = any> {
	id: string;
	name: string;
	icon: string;
	component: Component;
	smallHeader?: boolean;
	slots: {
		options: Component;
		sidebar: Component;
		actions: Component;
	};
	setup: (LayoutOptions: LayoutProps<Options, Query>) => any;
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

export type LayoutState<T, Options, Query> = {
	props: LayoutProps<Options, Query>;
} & T;
