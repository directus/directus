import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue, Wrapper } from '@vue/test-utils';
import VPagination from './v-pagination.vue';

import VButton from '@/components/v-button';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-button', VButton);
localVue.component('v-icon', VIcon);

describe('Components / Pagination', () => {
	let component: Wrapper<Vue>;

	beforeEach(() => {
		component = shallowMount(VPagination, {
			localVue,
			propsData: {
				length: 5,
				totalVisible: 5,
				value: 1,
			},
		});
	});

	describe('Visible Pages', () => {
		it('Renders all pages when totalVisible is not set', async () => {
			component.setProps({
				totalVisible: undefined,
				length: 5,
				value: 1,
			});

			await component.vm.$nextTick();

			expect((component.vm as any).visiblePages).toEqual([1, 2, 3, 4, 5]);
		});

		it('Starts at 1 when current value is less than half of totalVisible', async () => {
			component.setProps({
				totalVisible: 5,
				length: 15,
				value: 2,
			});

			await component.vm.$nextTick();

			expect((component.vm as any).visiblePages).toEqual([1, 2, 3, 4, 5]);
		});

		it('Renders the current value in the middle', async () => {
			component.setProps({
				totalVisible: 5,
				length: 15,
				value: 5,
			});

			await component.vm.$nextTick();

			expect((component.vm as any).visiblePages).toEqual([3, 4, 5, 6, 7]);
		});

		it('Renders the current value on the right of the the middle when totalVisible is even', async () => {
			component.setProps({
				totalVisible: 6,
				length: 15,
				value: 7,
			});

			await component.vm.$nextTick();

			expect((component.vm as any).visiblePages).toEqual([4, 5, 6, 7, 8, 9]);
		});

		it('Renders the last numbers when value is in last half of length', async () => {
			component.setProps({
				totalVisible: 6,
				length: 15,
				value: 14,
			});

			await component.vm.$nextTick();

			expect((component.vm as any).visiblePages).toEqual([10, 11, 12, 13, 14, 15]);
		});
	});

	it('Calls emit with value - 1 on toPrev', async () => {
		component.setProps({
			totalVisible: 5,
			length: 10,
			value: 3,
		});

		await component.vm.$nextTick();

		(component.vm as any).toPrev();

		expect(component.emitted('input')?.[0][0]).toBe(2);
	});

	it('Calls emit with value + 1 on toNext', async () => {
		component.setProps({
			totalVisible: 5,
			length: 10,
			value: 3,
		});

		await component.vm.$nextTick();

		(component.vm as any).toNext();

		expect(component.emitted('input')?.[0][0]).toBe(4);
	});

	it('Calls emit with value on toPage', async () => {
		component.setProps({
			totalVisible: 5,
			length: 10,
			value: 3,
		});

		await component.vm.$nextTick();

		(component.vm as any).toPage(9);

		expect(component.emitted('input')?.[0][0]).toBe(9);
	});
});
