import CollectionsOverview from './collections-overview.vue';
import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import useNavigation from '../compositions/use-navigation';
import VTable from '@/components/v-table';
import PrivateView from '@/views/private/';
import router from '@/router';

jest.mock('../compositions/use-navigation');
jest.mock('@/router');

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-table', VTable);
localVue.component('private-view', PrivateView);

describe('Modules / Collections / Routes / CollectionsOverview', () => {
	beforeEach(() => {
		(useNavigation as jest.Mock).mockImplementation(() => ({
			navItems: []
		}));
	});

	it('Uses useNavigation to get navigation links', () => {
		shallowMount(CollectionsOverview, { localVue });
		expect(useNavigation).toHaveBeenCalled();
	});

	it('Calls router.push on navigation', () => {
		const component = shallowMount(CollectionsOverview, { localVue });
		(component.vm as any).navigateToCollection({
			collection: 'test',
			name: 'Test',
			icon: 'box',
			to: '/test-route'
		});

		expect(router.push).toHaveBeenCalledWith('/test-route');
	});
});
