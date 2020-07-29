import InterfaceToggle from './toggle.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VCheckbox from '@/components/v-checkbox';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-checkbox', VCheckbox);
localVue.component('v-icon', VIcon);

describe('Interfaces / Toggle', () => {
	it('Renders a v-checkbox', () => {
		const component = shallowMount(InterfaceToggle, {
			localVue,
			listeners: {
				input: () => undefined,
			},
		});

		expect(component.find(VCheckbox).exists()).toBe(true);
	});
});
