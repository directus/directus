import Vue, { Component, AsyncComponent } from 'vue';

function registerComponent(id: string, component: Component | AsyncComponent): void;
function registerComponent(id: string, component: Parameters<typeof Vue.component>[1]): void;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function registerComponent(id: string, component: any): void {
	Vue.component(id, component);
}

export { registerComponent };
export default registerComponent;
