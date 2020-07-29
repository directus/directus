import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import InterfaceDivider from './divider.vue';

import VDivider from '@/components/v-divider';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-divider', VDivider);

describe('Interfaces / Numeric', () => {
	it('Renders a v-input', () => {
		const component = shallowMount(InterfaceDivider, {
			localVue,
		});
		expect(component.find(VDivider).exists()).toBe(true);
	});
});
