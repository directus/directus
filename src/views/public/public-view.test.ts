import VueCompositionAPI from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.directive('tooltip', VTooltip);

import PublicView from './public-view.vue';

describe('Views / Public', () => {
	it('Works', () => {
		const component = mount(PublicView, { localVue });
	});
});
