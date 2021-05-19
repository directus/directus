import { Component, ComponentPublicInstance } from 'vue';
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
	collection: string;
	selection?: Item[];
	layoutOptions: any;
	layoutQuery: any;
	filters: Filter[];
	searchQuery: string | null;
	selectMode: boolean;
	readonly: boolean;
	resetPreset?: () => Promise<void>;
}

export type LayoutContext = Record<string, any>;

export type LayoutDefineParam = LayoutConfig | ((context: LayoutContext) => LayoutConfig);

export interface LayoutComponent extends ComponentPublicInstance {
	refresh: () => Promise<void>;
}
