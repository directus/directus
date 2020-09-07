import DisplayTags from './tags.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VueCompositionAPI from '@vue/composition-api';
import VChip from '@/components/v-chip';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-chip', VChip);

describe('Displays / Tags', () => {
	it('Renders a chip for every value', () => {
		const component = shallowMount(DisplayTags, {
			localVue,
			propsData: {
				value: ['tag 1', 'tag 2', 'tag 3'],
			},
		});

		expect(component.findAll(VChip).length).toBe(3);
	});
});
