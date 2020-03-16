import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import PrivateView from './private-view.vue';
import VOverlay from '@/components/v-overlay';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-overlay', VOverlay);

describe('Views / Private', () => {
	it('Adds the is-open class to the nav', async () => {
		const component = shallowMount(PrivateView, {
			localVue,
			propsData: {
				title: 'Title'
			}
		});

		expect(component.find('.navigation').classes()).toEqual(['navigation']);

		(component.vm as any).navOpen = true;

		await component.vm.$nextTick();

		expect(component.find('.navigation').classes()).toEqual(['navigation', 'is-open']);
	});

	it('Adds the is-open class to the drawer', async () => {
		const component = shallowMount(PrivateView, {
			localVue,
			propsData: {
				title: 'Title'
			}
		});

		expect(component.find('.drawer').classes()).toEqual(['drawer', 'alt-colors']);

		(component.vm as any).drawerOpen = true;

		await component.vm.$nextTick();

		expect(component.find('.drawer').classes()).toEqual(['drawer', 'alt-colors', 'is-open']);
	});
});
