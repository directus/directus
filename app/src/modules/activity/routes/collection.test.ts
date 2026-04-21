import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, shallowRef } from 'vue';
import { createI18n } from 'vue-i18n';
import ActivityCollection from './collection.vue';

vi.mock('@directus/composables', () => ({
	useLayout: () => ({
		layoutWrapper: shallowRef(
			defineComponent({
				props: {
					collection: {
						type: String,
						required: true,
					},
					layoutOptions: {
						type: Object,
						default: () => ({}),
					},
					layoutQuery: {
						type: Object,
						default: () => ({}),
					},
					filter: {
						type: Object,
						default: null,
					},
					filterUser: {
						type: Object,
						default: null,
					},
					filterSystem: {
						type: Object,
						default: null,
					},
					search: {
						type: String,
						default: null,
					},
					showSelect: {
						type: String,
						default: 'none',
					},
				},
				setup(_props, { slots }) {
					return () => slots.default?.({ layoutState: {} });
				},
			}),
		),
	}),
}));

vi.mock('@/composables/use-preset', () => ({
	usePreset: () => ({
		layout: ref('table'),
		layoutOptions: ref({}),
		layoutQuery: ref({}),
		filter: ref(null),
		search: ref(null),
	}),
}));

const i18n = createI18n({
	legacy: false,
	locale: 'en',
	messages: {
		en: {
			activity_feed: 'Activity Feed',
			activity_history_notice: '{limit} days of Activity History is included in your current plan.',
			no_results: 'No Results',
			no_results_copy: 'No results copy',
			item_count: '0 Items',
			no_items_copy: 'No items copy',
		},
	},
});

const baseStubs = {
	PrivateView: defineComponent({
		setup(_props, { slots }) {
			return () =>
				h('div', [
					slots['actions:prepend']?.(),
					slots.actions?.(),
					slots.navigation?.(),
					slots.default?.(),
					slots.sidebar?.(),
				]);
		},
	}),
	VNotice: defineComponent({
		setup(_props, { slots }) {
			return () => h('div', { 'data-test': 'activity-history-notice' }, slots.title?.());
		},
	}),
	VInfo: true,
	ActivityNavigation: true,
	SearchInput: true,
	RouterView: true,
	LayoutSidebarDetail: true,
	'layout-actions-table': true,
	'layout-options-table': true,
	'layout-sidebar-table': true,
	'layout-table': defineComponent({
		setup(_props, { slots }) {
			return () => h('div', slots.default?.());
		},
	}),
};

function mountComponent(activityLimit: number | null | undefined) {
	return mount(ActivityCollection, {
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					initialState: {
						serverStore: {
							info: {
								license:
									activityLimit === undefined
										? null
										: {
												activity_history_days: {
													limit: activityLimit,
												},
											},
							},
						},
					},
				}),
				i18n,
			],
			stubs: baseStubs,
		},
	});
}

describe('Activity history notice', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('shows the history notice when the limit is a positive number', () => {
		const wrapper = mountComponent(30);

		expect(wrapper.get('[data-test="activity-history-notice"]').text()).toContain(
			'30 days of Activity History is included in your current plan.',
		);
	});

	it('hides the history notice when the limit is not a positive number', () => {
		const wrapper = mountComponent(0);

		expect(wrapper.find('[data-test="activity-history-notice"]').exists()).toBe(false);
	});
});
