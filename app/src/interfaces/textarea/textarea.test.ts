import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import InterfaceTextarea from './textarea.vue';

import VTextarea from '@/components/v-textarea';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-textarea', VTextarea);

describe('Interfaces / Text Input', () => {
	it('Renders a v-textarea', () => {
		const component = shallowMount(InterfaceTextarea, {
			localVue,
			propsData: {
				placeholder: 'Enter value...',
			},
			listeners: {
				input: () => {},
			},
		});
		expect(component.find(VTextarea).exists()).toBe(true);
	});
});
