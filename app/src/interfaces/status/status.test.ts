import VueCompositionAPI from '@vue/composition-api';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import InterfaceStatus from './status.vue';
import VNotice from '@/components/v-notice';
import VMenu from '@/components/v-menu';
import VList, { VListItem, VListItemIcon, VListItemContent } from '@/components/v-list';
import i18n from '@/lang';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.component('v-notice', VNotice);
localVue.component('v-menu', VMenu);
localVue.component('v-list', VList);
localVue.component('v-list-item', VListItem);
localVue.component('v-list-item-content', VListItemContent);
localVue.component('v-list-item-icon', VListItemIcon);

describe('Interfaces / Slider', () => {
	it('Renders a notice when status mapping is missing', () => {
		const component = shallowMount(InterfaceStatus, {
			localVue,
			i18n,
			propsData: {},
		});

		expect(component.find(VNotice).exists()).toBe(true);
	});

	it('Converts the status mapping into a loopable array', () => {
		const component = shallowMount(InterfaceStatus, {
			localVue,
			i18n,
			propsData: {
				status_mapping: null,
			},
		});

		expect((component.vm as any).statuses).toBe(null);

		component.setProps({
			status_mapping: {
				test: {
					name: 'Test',
					background_color: '#abcabc',
				},
				another_test: {
					name: 'Another Test',
					background_color: '#123123',
				},
			},
		});

		expect((component.vm as any).statuses).toEqual([
			{
				value: 'test',
				name: 'Test',
				color: '#abcabc',
			},
			{
				value: 'another_test',
				name: 'Another Test',
				color: '#123123',
			},
		]);
	});
});
