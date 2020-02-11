import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';
import VIcon from '@/components/v-icon/';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.directive('tooltip', VTooltip);
localVue.component('v-icon', VIcon);

import PublicView from './public-view.vue';

describe('Views / Public', () => {
	it('Works', () => {
		const component = mount(PublicView, { localVue });
	});
});
