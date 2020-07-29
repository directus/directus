import { mount, createLocalVue, Wrapper } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

import VProgressCircular from './v-progress-circular.vue';

describe('Spinner', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => (component = mount(VProgressCircular, { localVue })));

	it('Adds the correct classes based on props', async () => {
		component.setProps({
			indeterminate: true,
		});
		await component.vm.$nextTick();
		expect(component.find('svg').classes()).toContain('indeterminate');
	});

	it('Calculates the correct stroke-dasharray', async () => {
		component.setProps({
			value: 0,
		});
		await component.vm.$nextTick();
		expect((component.vm as any).circleStyle).toEqual({
			'stroke-dasharray': '0, 78.5',
		});

		component.setProps({
			value: 25,
		});
		await component.vm.$nextTick();
		expect((component.vm as any).circleStyle).toEqual({
			'stroke-dasharray': '19.625, 78.5',
		});

		component.setProps({
			value: 50,
		});
		await component.vm.$nextTick();
		expect((component.vm as any).circleStyle).toEqual({
			'stroke-dasharray': '39.25, 78.5',
		});

		component.setProps({
			value: 75,
		});
		await component.vm.$nextTick();
		expect((component.vm as any).circleStyle).toEqual({
			'stroke-dasharray': '58.875, 78.5',
		});

		component.setProps({
			value: 100,
		});
		await component.vm.$nextTick();
		expect((component.vm as any).circleStyle).toEqual({
			'stroke-dasharray': '78.5, 78.5',
		});
	});
});
