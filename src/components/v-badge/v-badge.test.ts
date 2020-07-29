import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

import VBadge from './v-badge.vue';
import VIcon from '../v-icon/';

describe('Chip', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VBadge, { localVue });
	});

	it('Adds the dot prop to the badge', async () => {
		component.setProps({
			dot: true,
		});

		await component.vm.$nextTick();

		expect(component.find('.badge').classes()).toContain('dot');
	});

	it('Adds the bordered prop to the badge', async () => {
		component.setProps({
			bordered: true,
		});

		await component.vm.$nextTick();

		expect(component.find('.badge').classes()).toContain('bordered');
	});

	it('Display the badge on the left', async () => {
		component.setProps({
			left: true,
		});

		await component.vm.$nextTick();

		expect(component.find('.badge').classes()).toContain('left');
	});

	it('Display the badge on the bottom', async () => {
		component.setProps({
			bottom: true,
		});

		await component.vm.$nextTick();

		expect(component.find('.badge').classes()).toContain('bottom');
	});

	it('Checks if the icon exists and if the name matches', async () => {
		component.setProps({
			icon: 'add',
		});

		await component.vm.$nextTick();

		expect(component.find('.v-icon').exists()).toBe(true);
		expect(component.find('.v-icon').props().name).toBe('add');
	});
});
