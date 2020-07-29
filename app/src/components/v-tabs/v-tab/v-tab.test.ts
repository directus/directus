import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VTab from './v-tab.vue';

const mockUseGroupableContent = {
	active: {
		value: false,
	},
	toggle: jest.fn(),
};

jest.mock('@/composables/groupable', () => ({
	useGroupable: () => mockUseGroupableContent,
}));

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-tab', VTab);

describe('Components / Tabs / Tab', () => {
	it('Calls toggle on click', () => {
		const component = shallowMount(VTab, { localVue });
		component.trigger('click');
		expect(mockUseGroupableContent.toggle).toHaveBeenCalled();
	});

	it('Does not call toggle when disabled', () => {
		const component = shallowMount(VTab, {
			localVue,
			propsData: {
				disabled: true,
			},
		});
		component.trigger('click');
		expect(mockUseGroupableContent.toggle).not.toHaveBeenCalled();
	});
});
