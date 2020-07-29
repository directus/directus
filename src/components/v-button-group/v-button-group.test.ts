import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VButtonGroup from './v-button-group.vue';
import VItemGroup from '@/components/v-item-group/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-item-group', VItemGroup);

jest.mock('@/composables/groupable');

describe('Components / Button Group', () => {
	it('Renders', () => {
		const component = shallowMount(VButtonGroup, { localVue });
		expect(component.isVueInstance()).toBe(true);
	});
});
