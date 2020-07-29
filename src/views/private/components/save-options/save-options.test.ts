import SaveOptions from './save-options.vue';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import { i18n } from '@/lang';

import VList, { VListItem, VListItemIcon, VListItemContent, VListItemHint } from '@/components/v-list/';
import VIcon from '@/components/v-icon';
import VMenu from '@/components/v-menu';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-list', VList);
localVue.component('v-list-item', VListItem);
localVue.component('v-list-item-icon', VListItemIcon);
localVue.component('v-list-item-content', VListItemContent);
localVue.component('v-list-item-hint', VListItemHint);
localVue.component('v-icon', VIcon);
localVue.component('v-menu', VMenu);

describe('Views / Private / Components / Save Options', () => {
	it('Renders', () => {
		const component = shallowMount(SaveOptions, {
			localVue,
			i18n,
		});

		expect(component.isVueInstance()).toBe(true);
	});
});
