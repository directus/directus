import { Component, ComponentPublicInstance } from 'vue';

export interface LayoutConfig {
	id: string;
	name: string;
	icon: string;
	component: Component;
}

export type LayoutContext = {};

export type LayoutDefineParam = LayoutConfig | ((context: LayoutContext) => LayoutConfig);

export interface LayoutComponent extends ComponentPublicInstance {
	refresh: () => Promise<void>;
}
