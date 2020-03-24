import CollectionsNavigation from './navigation.vue';
import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import * as useNavigation from '../../compositions/use-navigation';
import VList, {
	VListItem,
	VListItemContent,
	VListItemIcon,
	VListItemTitle,
} from '@/components/v-list';
import VIcon from '@/components/v-icon';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-list', VList);
localVue.component('v-list-item', VListItem);
localVue.component('v-list-item-content', VListItemContent);
localVue.component('v-list-item-title', VListItemTitle);
localVue.component('v-list-item-icon', VListItemIcon);
localVue.component('v-icon', VIcon);

describe('Modules / Collections / Components / CollectionsNavigation', () => {
	it('Uses useNavigation to get navigation links', () => {
		jest.spyOn(useNavigation, 'default').mockImplementation(
			() =>
				({
					navItems: [],
				} as any)
		);
		shallowMount(CollectionsNavigation, { localVue });
		expect(useNavigation.default).toHaveBeenCalled();
	});
});
