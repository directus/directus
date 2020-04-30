import { mount, createLocalVue } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VItem from './v-item.vue';
import * as composable from '@/composables/groupable/groupable';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-item', VItem);

describe('Components / Item Group / Item', () => {
	it('Calls the groupable composable', () => {
		jest.spyOn(composable, 'useGroupable');
		mount(VItem, {
			localVue,
			provide: {
				'item-group': {
					register: jest.fn(),
					unregister: jest.fn(),
					toggle: jest.fn(),
				},
			},
		});
		expect(composable.useGroupable).toHaveBeenCalled();
	});
});
