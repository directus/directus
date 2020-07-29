import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import HeaderBarActions from './header-bar-actions.vue';

import VButton from '@/components/v-button';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-button', VButton);
localVue.component('v-icon', VIcon);

describe('Views / Private / Header Bar Actions', () => {
	it('Renders', () => {
		const component = mount(HeaderBarActions, {
			localVue,
		});

		expect(component.isVueInstance()).toBeTruthy();
	});
});
