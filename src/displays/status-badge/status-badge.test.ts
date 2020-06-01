import DisplayStatusBadge from './status-badge.vue';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import VIcon from '@/components/v-icon';
import VueCompositionAPI from '@vue/composition-api';
import Tooltip from '@/directives/tooltip';

const localVue = createLocalVue();
localVue.component('v-icon', VIcon);
localVue.use(VueCompositionAPI);
localVue.directive('tooltip', Tooltip);

describe('Displays / Status Badge', () => {
	it('Renders an empty span if no value is passed', () => {
		const component = shallowMount(DisplayStatusBadge, {
			localVue,
			propsData: {
				value: null,
			},
		});

		expect(component.find('span').exists()).toBe(true);
		expect(component.find('span').text()).toBe('');
	});

	it('Renders a question mark icon is status is unknown in interface options', () => {
		const component = shallowMount(DisplayStatusBadge, {
			localVue,
			propsData: {
				value: 'draft',
				interfaceOptions: {
					status_mapping: {
						published: {},
					},
				},
			},
		});

		expect(component.find(VIcon).exists()).toBe(true);
		expect(component.attributes('name')).toBe('help_outline');
	});

	it('Renders the badge with the correct colors', () => {
		const component = shallowMount(DisplayStatusBadge, {
			localVue,
			propsData: {
				value: 'draft',
				interfaceOptions: {
					status_mapping: {
						draft: {
							background_color: 'rgb(171, 202, 188)',
							text_color: 'rgb(150, 100, 125)',
						},
					},
				},
			},
		});

		expect(component.exists()).toBe(true);
		expect(component.attributes('style')).toBe('background-color: rgb(171, 202, 188); color: rgb(150, 100, 125);');
	});

	it('Sets status to null if interface options are missing', () => {
		const component = shallowMount(DisplayStatusBadge, {
			localVue,
			propsData: {
				value: 'draft',
				interfaceOptions: null,
			},
		});

		expect((component.vm as any).status).toBe(null);
	});
});
