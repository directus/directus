import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

import VForm from './v-form.vue';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Components / Form', () => {
	it('Renders', () => {
		const component = shallowMount(VForm, { localVue, propsData: { collection: 'test' } });
		expect(component.isVueInstance()).toBe(true);
	});
});
