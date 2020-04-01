import VFancySelect from './v-fancy-select.vue';
import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VIcon from '@/components/v-icon/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Components / Fancy Select', () => {
	it('Renders', () => {
		const component = shallowMount(VFancySelect, { localVue, propsData: { items: [] } });
		expect(component.isVueInstance()).toBe(true);
	});

	it('Calculates the visible items correctly', async () => {
		const items = [
			{
				value: 'code',
				icon: 'code',
				text: 'Raw Value',
				description: 'This works for most non-relational fields',
			},
			{
				value: 'palette',
				icon: 'palette',
				text: 'Formatted Value',
				description: 'Templated formatting and conditional coloring to text values',
			},
			{
				value: 'label',
				icon: 'label',
				text: 'Placard',
				description: 'Shows the value within a colored badge',
			},
			{
				value: 'assignment_turned_in',
				icon: 'assignment_turned_in',
				text: 'Progress',
				description: 'Converts number values into a progress bar',
			},
		];

		const component = shallowMount(VFancySelect, {
			localVue,
			propsData: {
				items: items,
			},
		});

		expect((component.vm as any).visibleItems).toEqual(items);

		component.setProps({
			value: 'label',
		});

		expect((component.vm as any).visibleItems).toEqual([items[2]]);
	});
});
