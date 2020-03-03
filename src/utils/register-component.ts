import Vue, { Component } from 'vue';

function registerComponent(id: string, component: Component): void;
function registerComponent(id: string, component: Parameters<typeof Vue.component>[1]): void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerComponent(id: string, component: any) {
	Vue.component(id, component);
}

export { registerComponent };
export default registerComponent;
