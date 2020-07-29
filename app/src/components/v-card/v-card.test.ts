import VCard from './v-card.vue';
import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);

describe('Components / Card', () => {
	it('Renders', () => {
		const component = shallowMount(VCard, { localVue });
		expect(component.isVueInstance()).toBe(true);
	});
});
