import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import InterfaceMarkdown from './markdown.vue';

import VTextarea from '@/components/v-textarea';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-textarea', VTextarea);

describe('Interfaces / Markdown', () => {
	it('Renders a v-markdown', () => {
		const component = shallowMount(InterfaceMarkdown, {
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
