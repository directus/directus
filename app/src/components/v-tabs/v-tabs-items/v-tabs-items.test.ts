import { shallowMount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';

import VTabsItems from './v-tabs-items.vue';

import VItemGroup from '@/components/v-item-group';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-item-group', VItemGroup);

describe('Components / Tabs / Tabs Items', () => {
	it('Emits the new selection on update', () => {
		const component = shallowMount(VTabsItems, { localVue });
		(component.vm as any).update([1]);
		expect(component.emitted('input')?.[0][0]).toEqual([1]);
	});
});
