import { Component, ComponentPublicInstance } from 'vue';
import { Item } from '@/components/v-table/types';
import { Filter } from '@/types';

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
	setup: (LayoutOptions: LayoutProps<Options, Query>) => any;
}

export interface LayoutProps<Options = any, Query = any> {
	collection: string | null;
	selection: Item[];
	layoutOptions: Options;
	layoutQuery: Query;
	filters: Filter[];
	searchQuery: string | null;
	selectMode: boolean;
	readonly: boolean;
	resetPreset?: () => Promise<void>;
}

export type LayoutContext = Record<string, any>;

export type LayoutDefineParam<Options = any, Query = any> =
	| LayoutConfig<Options, Query>
	| ((context: LayoutContext) => LayoutConfig<Options, Query>);

export interface LayoutComponent extends ComponentPublicInstance {
	refresh: () => Promise<void>;
}
