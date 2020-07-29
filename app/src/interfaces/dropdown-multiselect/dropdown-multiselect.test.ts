import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

import VNotice from '@/components/v-notice';
import VSelect from '@/components/v-select';
import VIcon from '@/components/v-icon';
import InterfaceDropdownMultiselect from './dropdown-multiselect.vue';
import VueI18n from 'vue-i18n';
import i18n from '@/lang';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.use(VueI18n);
localVue.component('v-select', VSelect);
localVue.component('v-notice', VNotice);
localVue.component('v-icon', VIcon);

describe('Interfaces / Dropdown (Multiselect)', () => {
	it('Renders a notice when choices arent set', async () => {
		const component = shallowMount(InterfaceDropdownMultiselect, {
			localVue,
			i18n,
			listeners: {
				input: () => undefined,
			},
		});
		expect(component.find(VNotice).exists()).toBe(true);
	});

	it('Renders select when choices exist', async () => {
		const component = shallowMount(InterfaceDropdownMultiselect, {
			localVue,
			i18n,
			listeners: {
				input: () => undefined,
			},
			propsData: {
				choices: `
					test
				`,
			},
		});
		expect(component.find(VSelect).exists()).toBe(true);
	});
});
