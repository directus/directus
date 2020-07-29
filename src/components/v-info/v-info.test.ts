import VInfo from './v-info.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-icon', VIcon);

describe('Components / Info', () => {
	it('Renders', () => {
		const component = shallowMount(VInfo, { localVue, propsData: { title: 'test' } });
		expect(component.isVueInstance()).toBe(true);
	});
});
