import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VBreadcrumb from './v-breadcrumb.vue';
import VIcon from '../v-icon/';

import VueRouter from 'vue-router';

const router = new VueRouter();

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);
localVue.use(VueRouter);

describe('Breadcrumb', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = mount(VBreadcrumb, { localVue, router });
		jest.useFakeTimers();
	});

	it('Renders the whole breadcrump', async () => {
		component.setProps({
			items: [
				{ name: 'A', to: 'linkA' },
				{ name: 'B', to: 'linkB' },
				{ name: 'C', to: 'linkC' },
			],
		});

		await component.vm.$nextTick();

		const sections = component.findAll('.section a.section-link');

		expect(sections.at(0).text()).toBe('A');
		expect(sections.at(0).attributes().href).toContain('linkA');

		expect(sections.at(1).text()).toBe('B');
		expect(sections.at(1).attributes().href).toContain('linkB');

		expect(sections.at(2).text()).toBe('C');
		expect(sections.at(2).attributes().href).toContain('linkC');
	});

	it('Renders breadcrumb with icon ', async () => {
		component.setProps({
			items: [
				{ name: 'A', to: 'linkA' },
				{ name: 'B', to: 'linkB', icon: 'home' },
				{ name: 'C', to: 'linkC', icon: 'add' },
			],
		});

		await component.vm.$nextTick();

		const sections = component.findAll('.section a.section-link');

		expect(sections.at(0).find('.v-icon').exists()).toBe(false);
		expect(sections.at(1).find('.v-icon').text()).toBe('home');
		expect(sections.at(2).find('.v-icon').text()).toBe('add');
	});

	it('Renders breadcrumb with disabled section ', async () => {
		component.setProps({
			items: [
				{ name: 'A', to: 'linkA' },
				{ name: 'B', to: 'linkB', disabled: true },
				{ name: 'C', to: 'linkC' },
			],
		});

		await component.vm.$nextTick();

		expect(component.findAll('.section').at(1).classes()).toContain('disabled');
	});
});
