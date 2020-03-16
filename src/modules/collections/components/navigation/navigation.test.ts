import CollectionsNavigation from './navigation.vue';
import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import useNavigation from '../../compositions/use-navigation';
import VList, {
	VListItem,
	VListItemContent,
	VListItemIcon,
	VListItemTitle
} from '@/components/v-list';
import VIcon from '@/components/v-icon';

jest.mock('../../compositions/use-navigation');

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-list', VList);
localVue.component('v-list-item', VListItem);
localVue.component('v-list-item-content', VListItemContent);
localVue.component('v-list-item-title', VListItemTitle);
localVue.component('v-list-item-icon', VListItemIcon);
localVue.component('v-icon', VIcon);

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
