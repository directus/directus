import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VTabItem from './v-tab-item.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

jest.mock('@/composables/groupable', () => ({
	useGroupable: () => ({
		active: { value: null },
		toggle: jest.fn(),
	}),
}));

describe('Components / Tabs / Tab', () => {
	it('Renders when active', () => {
		const component = shallowMount(VTabItem, {
			localVue,
			data: () => ({
				active: true,
			}),
		});
		expect(component.find('.v-tab-item').exists()).toBe(true);
	});

	it('Does not render when inactive', () => {
		const component = shallowMount(VTabItem, {
			localVue,
			data: () => ({
				active: false,
			}),
		});
		expect(component.find('.v-tab-item').exists()).toBe(false);
	});
});
