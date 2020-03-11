import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import CollectionsDetail from './detail.vue';
import PrivateView from '@/views/private-view';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('private-view', PrivateView);

describe('Modules / Collections / Detail', () => {
	it('Renders', () => {
		const component = shallowMount(CollectionsDetail, {
			localVue,
			propsData: {
				collection: 'my-test',
				primaryKey: 'id'
			}
		});
		expect(component.isVueInstance()).toBe(true);
	});
});
