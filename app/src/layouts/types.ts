import { Component, ComponentPublicInstance } from 'vue';

export interface LayoutConfig {
	id: string;
	name: string;
	icon: string;
	component: Component;
}

export type LayoutContext = Record<string, any>;

export type LayoutDefineParam = LayoutConfig | ((context: LayoutContext) => LayoutConfig);

export interface LayoutComponent extends ComponentPublicInstance {
	refresh: () => Promise<void>;
}
