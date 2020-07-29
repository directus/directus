import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VItemGroup from './v-item-group.vue';
import * as composition from '@/composables/groupable/groupable';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-item-group', VItemGroup);

describe('Components / Item Group', () => {
	it('Calls the useGroupableParent composition', () => {
		jest.spyOn(composition, 'useGroupableParent');
		mount(VItemGroup, { localVue });
		expect(composition.useGroupableParent).toHaveBeenCalled();
	});

	it('Emits the input event on selection changes in the groupable composition', () => {
		jest.spyOn(composition, 'useGroupableParent').mockImplementation((state: any): any => {
			state.onSelectionChange([1, 2, 3]);
		});
		const component = mount(VItemGroup, { localVue });
		expect(component.emitted('input')?.[0][0]).toEqual([1, 2, 3]);
	});
});
