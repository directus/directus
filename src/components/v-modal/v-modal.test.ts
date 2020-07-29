import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

import VModal from './v-modal.vue';
import VDialog from '@/components/v-dialog/';
import VIcon from '@/components/v-icon/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-dialog', VDialog);
localVue.component('v-icon', VIcon);

describe('Components / Modal', () => {
	it('Renders', () => {
		const component = shallowMount(VModal, {
			localVue,
			propsData: {
				title: 'My Modal',
			},
		});

		expect(component.isVueInstance()).toBe(true);
	});
});
