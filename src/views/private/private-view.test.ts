import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import PrivateView from './private-view.vue';
import VOverlay from '@/components/v-overlay';
import VProgressCircular from '@/components/v-progress/circular';
import PortalVue from 'portal-vue';
import VueI18n from 'vue-i18n';
import { i18n } from '@/lang';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.use(PortalVue);
localVue.use(VueI18n);
localVue.component('v-overlay', VOverlay);
localVue.component('v-progress-circular', VProgressCircular);

describe('Views / Private', () => {
	it('Adds the is-open class to the nav', async () => {
		const component = shallowMount(PrivateView, {
			localVue,
			i18n,
			propsData: {
				title: 'Title',
			},
		});

		expect(component.find('.navigation').classes()).toEqual(['navigation']);

		(component.vm as any).navOpen = true;

		await component.vm.$nextTick();

		expect(component.find('.navigation').classes()).toEqual(['navigation', 'is-open']);
	});
});
