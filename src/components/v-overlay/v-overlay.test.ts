import { shallowMount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VOverlay from './v-overlay.vue';

describe('Overlay', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = shallowMount(VOverlay, {
			localVue,
		});
	});

	it('Is invisible when active prop is false', () => {
		expect(component.classes()).toEqual(['v-overlay']);
	});

	it('Is visible when active is true', async () => {
		component.setProps({ active: true });
		await component.vm.$nextTick();
		expect(component.classes()).toEqual(['v-overlay', 'active']);
	});

	it('Sets position absolute based on absolute prop', async () => {
		component.setProps({ active: true, absolute: true });
		await component.vm.$nextTick();
		expect(component.classes()).toContain('absolute');
	});

	it('Adds the has-click class when click event is passed', async () => {
		const component = shallowMount(VOverlay, {
			localVue,
			listeners: {
				click: () => {},
			},
		});
		expect(component.classes()).toContain('has-click');
	});

	it('Emits click event', async () => {
		component.find('.v-overlay').trigger('click');
		expect(component.emitted('click')?.[0]).toBeTruthy();
	});
});
