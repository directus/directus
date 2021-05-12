import { Component, Ref, ComponentPublicInstance } from 'vue';
import { Item } from '@/components/v-table/types';
import { Filter } from '@/types';

export interface LayoutConfig {
	id: string;
	name: string;
	icon: string;
	component: Component;
	slots: {
		options: Component;
		sidebar: Component;
		actions: Component;
	};
	setup: (LayoutOptions: LayoutProps) => any;
}

export interface LayoutProps {
	collection: Ref<string>;
	selection: Ref<Item[]>;
	layoutOptions: Ref<any>;
	layoutQuery: Ref<any>;
	filters: Ref<Filter[]>;
	searchQuery: Ref<string | null>;
	selectMode: Ref<boolean>;
	readonly: Ref<boolean>;
	resetPreset: Ref<() => Promise<void>>;
}

export type LayoutContext = Record<string, any>;

export type LayoutDefineParam = LayoutConfig | ((context: LayoutContext) => LayoutConfig);

export interface LayoutComponent extends ComponentPublicInstance {
	refresh: () => Promise<void>;
}
