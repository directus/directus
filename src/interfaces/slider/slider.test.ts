import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import InterfaceSlider from './slider.vue';

import VSlider from '@/components/v-slider';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-slider', VSlider);

describe('Interfaces / Slider', () => {
	it('Renders a v-slider', () => {
		const component = shallowMount(InterfaceSlider, {
			localVue,
			propsData: {},
			listeners: {
				input: () => {},
			},
		});
		expect(component.find(VSlider).exists()).toBe(true);
	});
});
