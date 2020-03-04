import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import HeaderBar from './header-bar.vue';

import VButton from '@/components/v-button';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-button', VButton);
localVue.component('v-icon', VIcon);

describe('Views / Private / Header Bar', () => {
	it('Emits toggle event when toggle buttons are clicked', () => {
		const component = mount(HeaderBar, {
			localVue,
			propsData: {
				title: 'Title'
			}
		});

		const navToggle = component.find('.nav-toggle');
		navToggle.trigger('click');

		expect(component.emitted('toggle:nav')[0]).toBeTruthy();

		const drawerToggle = component.find('.drawer-toggle');
		drawerToggle.trigger('click');

		expect(component.emitted('toggle:drawer')[0]).toBeTruthy();
	});
});
