import Vue, { Component } from 'vue';

export function registerComponent(id: string, component: Component): void;
export function registerComponent(id: string, component: Parameters<typeof Vue.component>[1]): void;

export function registerComponent(id: string, component: any) {
	Vue.component(id, component);
}
