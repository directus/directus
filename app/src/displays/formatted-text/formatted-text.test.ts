import DisplayFormattedText from './formatted-text.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Displays / Formatted Text', () => {
	it('Strips out HTML', () => {
		const component = shallowMount(DisplayFormattedText, {
			localVue,
			propsData: {
				value: '<p>Test</p>',
			},
		});

		expect((component.vm as any).displayValue).toBe('Test');
		expect(component.text()).toBe('Test');
	});
});
