import CollectionsNavigation from './collections-navigation.vue';
import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import useNavigation from '../compositions/use-navigation';
import VList, { VListItem, VListItemContent } from '@/components/v-list';

jest.mock('../compositions/use-navigation');

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-list', VList);
localVue.component('v-list-item', VListItem);
localVue.component('v-list-item-content', VListItemContent);

describe('Modules / Collections / Components / CollectionsNavigation', () => {
	beforeEach(() => {
		(useNavigation as jest.Mock).mockImplementation(() => ({
			navItems: {
				value: []
			}
		}));
	});

	it('Uses useNavigation to get navigation links', () => {
		shallowMount(CollectionsNavigation, { localVue });
		expect(useNavigation).toHaveBeenCalled();
	});
});
