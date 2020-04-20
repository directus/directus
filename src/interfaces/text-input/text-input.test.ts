import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import InterfaceTextInput from './text-input.vue';

import VInput from '@/components/v-input';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-input', VInput);

describe('Interfaces / Text Input', () => {
	it('Renders a v-input', () => {
		const component = shallowMount(InterfaceTextInput, {
			localVue,
			propsData: {
				trim: false,
				placeholder: 'Enter value...',
			},
			listeners: {
				input: () => {},
			},
		});
		expect(component.find(VInput).exists()).toBe(true);
	});
});
