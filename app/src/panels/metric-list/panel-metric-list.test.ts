import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PanelMetricList from './panel-metric-list.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';
import RenderTemplate from '@/views/private/components/render-template.vue';

const global: GlobalMountOptions = {
	stubs: {
		RenderTemplate: true,
		VList: { template: '<div class="v-list"><slot /></div>' },
		VListItem: { template: '<div class="v-list-item"><slot /></div>' },
	},
	plugins: [i18n, createTestingPinia({ createSpy: () => () => {} })],
};

const baseProps = {
	collection: 'posts',
	dashboard: 'dashboard-1',
	groupByField: 'author',
	aggregateField: 'views',
	aggregateFunction: 'sum',
	sortDirection: 'desc',
};

describe('panel-metric-list', () => {
	it('should mount', () => {
		const wrapper = mount(PanelMetricList, { props: baseProps, global });
		expect(wrapper.exists()).toBe(true);
	});

	describe('without a display field configured', () => {
		it('renders the raw group value via RenderTemplate (unchanged behavior)', () => {
			const wrapper = mount(PanelMetricList, {
				props: {
					...baseProps,
					data: [{ sum: { views: 200 }, group: { author: 2 } }],
				} as any,
				global,
			});

			const renderTemplate = wrapper.findComponent(RenderTemplate);
			expect(renderTemplate.exists()).toBe(true);
			expect(renderTemplate.props('item')).toEqual({ author: 2 });
		});
	});

	describe('with a display field configured and a matching two-query result', () => {
		const twoQueryProps = {
			...baseProps,
			groupByDisplayField: 'name',
			data: [
				[
					{ sum: { views: 200 }, group: { author: 2 } },
					{ sum: { views: 150 }, group: { author: 1 } },
				],
				[
					{ id: 1, name: 'Alice' },
					{ id: 2, name: 'Bob' },
				],
			],
		} as any;

		it('resolves the raw group value to the related display value', () => {
			const wrapper = mount(PanelMetricList, { props: twoQueryProps, global });

			expect(wrapper.text()).toContain('Bob');
			expect(wrapper.text()).toContain('Alice');
			expect(wrapper.findComponent(RenderTemplate).exists()).toBe(false);
		});

		it('sorts by the aggregated value across both query results', () => {
			const wrapper = mount(PanelMetricList, { props: twoQueryProps, global });

			const text = wrapper.text();
			expect(text.indexOf('Bob')).toBeLessThan(text.indexOf('Alice'));
		});

		it('falls back to RenderTemplate for a raw value missing from the display map', () => {
			const wrapper = mount(PanelMetricList, {
				props: {
					...twoQueryProps,
					data: [
						[{ sum: { views: 30 }, group: { author: 3 } }],
						[
							{ id: 1, name: 'Alice' },
							{ id: 2, name: 'Bob' },
						],
					],
				},
				global,
			});

			expect(wrapper.findComponent(RenderTemplate).exists()).toBe(true);
		});
	});

	describe('with a two-query result but no display field configured', () => {
		it('falls back to RenderTemplate', () => {
			const wrapper = mount(PanelMetricList, {
				props: {
					...baseProps,
					data: [[{ sum: { views: 200 }, group: { author: 2 } }], [{ id: 2, name: 'Bob' }]],
				} as any,
				global,
			});

			expect(wrapper.findComponent(RenderTemplate).exists()).toBe(true);
		});
	});
});
