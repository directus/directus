import Vue, { Component } from 'vue';
import registerComponent from './register-component';

describe('Utils / Register Component', () => {
	it('Calls Vue.component with the given arguments', () => {
		const spy = jest.spyOn(Vue, 'component');
		const component: Component = {
			render(h) {
				return h('div');
			},
		};
		registerComponent('test', component);
		expect(spy).toHaveBeenCalledWith('test', component);
	});
});
