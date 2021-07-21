import { Component, ComponentPublicInstance } from 'vue';
import { LayoutProps } from '@directus/shared/types';

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

export type LayoutContext = Record<string, any>;

export type LayoutDefineParam<Options = any, Query = any> =
	| LayoutConfig<Options, Query>
	| ((context: LayoutContext) => LayoutConfig<Options, Query>);

export interface LayoutComponent extends ComponentPublicInstance {
	refresh: () => Promise<void>;
}
