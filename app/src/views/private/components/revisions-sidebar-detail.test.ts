import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import RevisionsSidebarDetail from './revisions-sidebar-detail.vue';

const revisionsByDate = ref([
	{
		date: new Date('2026-04-11T00:00:00.000Z'),
		dateFormatted: 'Today',
		revisions: [{ id: 1 }],
	},
	{
		date: new Date('2026-04-10T00:00:00.000Z'),
		dateFormatted: 'Yesterday',
		revisions: [{ id: 2 }],
	},
]);

const useRevisionsMock = vi.fn(() => ({
	revisions: ref([{ id: 1 }, { id: 2 }]),
	revisionsByDate,
	loading: ref(false),
	refresh: vi.fn(),
	revisionsCount: ref(2),
	pagesCount: ref(1),
	created: ref(undefined),
	getRevisions: vi.fn(),
	loadingCount: ref(false),
	getRevisionsCount: vi.fn(),
}));

vi.mock('@directus/composables', () => ({
	useGroupable: () => ({
		active: ref(true),
	}),
}));

vi.mock('@/composables/use-revisions', () => ({
	useRevisions: () => useRevisionsMock(),
}));

vi.mock('../private-view/stores/sidebar', () => ({
	useSidebarStore: () => ({
		activeAccordionItem: null,
	}),
}));

vi.mock('vue-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-router')>();

	return {
		...actual,
		useRoute: () => ({
			fullPath: '/content/posts/1',
		}),
	};
});

const i18n = createI18n({
	legacy: false,
	locale: 'en',
	messages: {
		en: {
			revisions: 'Revisions',
			no_revisions: 'No Revisions Yet',
			revisions_history_notice: '{limit} days of Revision History is included in your current plan.',
			revision_delta_created_externally: 'Created externally',
		},
	},
});

function mountComponent(revisionsLimit: number | null | undefined) {
	return mount(RevisionsSidebarDetail, {
		props: {
			collection: 'posts',
			primaryKey: 1,
			version: null,
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
					initialState: {
						serverStore: {
							info: {
								license:
									revisionsLimit === undefined
										? null
										: {
												revisions_history_days: {
													limit: revisionsLimit,
												},
											},
							},
						},
					},
				}),
				i18n,
			],
			stubs: {
				SidebarDetail: {
					template: '<div><slot /></div>',
				},
				VNotice: {
					template: '<div data-test="revisions-history-notice"><slot name="title" /></div>',
				},
				RevisionsDateGroup: {
					template: '<div data-test="revisions-group" />',
				},
				VDivider: true,
				VPagination: true,
				VProgressLinear: true,
				ComparisonModal: {
					props: ['currentCollab'],
					template: '<div />',
				},
			},
		},
	});
}

describe('Revisions history notice', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('shows a single history notice when the limit is a positive number', () => {
		const wrapper = mountComponent(14);

		expect(wrapper.findAll('[data-test="revisions-history-notice"]')).toHaveLength(1);

		expect(wrapper.get('[data-test="revisions-history-notice"]').text()).toContain(
			'14 days of Revision History is included in your current plan.',
		);
	});

	it('hides the history notice when the limit is not a positive number', () => {
		const wrapper = mountComponent(0);

		expect(wrapper.find('[data-test="revisions-history-notice"]').exists()).toBe(false);
	});
});
