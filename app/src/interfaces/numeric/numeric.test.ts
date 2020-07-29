import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import InterfaceNumeric from './numeric.vue';

import VInput from '@/components/v-input';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-input', VInput);

describe('Interfaces / Numeric', () => {
	it('Renders a v-input', () => {
		const component = shallowMount(InterfaceNumeric, {
			localVue,
			propsData: {},
			listeners: {
				input: () => {},
			},
		});
		expect(component.find(VInput).exists()).toBe(true);
		expect(component.find(VInput).attributes().type).toBe('number');
	});
});
