import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VTabs from './v-tabs.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-item-group', VTabs);

jest.mock('@/composables/groupable', () => ({
	useGroupableParent: () => {
		return {
			items: {
				value: [
					{
						active: {
							value: false,
						},
					},
					{
						active: {
							value: false,
						},
					},
					{
						active: {
							value: true,
						},
					},
					{
						active: {
							value: false,
						},
					},
				],
			},
		} as any;
	},
}));

describe('Components / Tabs', () => {
	it('Emits the input event on update', () => {
		const component = shallowMount(VTabs, { localVue });
		(component.vm as any).update(['a']);
		expect(component.emitted('input')?.[0][0]).toEqual(['a']);
	});

	it('Calculates the correct css variables based on children groupable items', () => {
		const component = shallowMount(VTabs, { localVue });

		expect((component.vm as any).slideStyle).toEqual({
			'--_v-tabs-items': 4,
			'--_v-tabs-selected': 2,
		});
	});
});
