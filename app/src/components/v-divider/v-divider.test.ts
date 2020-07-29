import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

import VDivider from './v-divider.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Components / Divider', () => {
	it('Renders', () => {
		const component = shallowMount(VDivider, { localVue });
		expect(component.isVueInstance()).toBe(true);
	});
});
