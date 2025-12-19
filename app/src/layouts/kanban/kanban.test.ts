import DisplayDateTime from '@/displays/datetime/datetime.vue';
import type { Field } from '@directus/types';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';
import Kanban from './kanban.vue';

const i18n = createI18n({ legacy: false, missingWarn: false });

describe('Kanban layout', () => {
	let pinia: ReturnType<typeof createPinia>;
	let router: ReturnType<typeof createRouter>;

	beforeEach(() => {
		pinia = createPinia();

		router = createRouter({
			history: createMemoryHistory(),
			routes: [],
		});

		// Setup Teleport targets
		const dialogOutlet = document.createElement('div');
		dialogOutlet.id = 'dialog-outlet';
		document.body.appendChild(dialogOutlet);
	});

	afterEach(() => {
		// Cleanup
		const dialogOutlet = document.getElementById('dialog-outlet');

		if (dialogOutlet) {
			document.body.removeChild(dialogOutlet);
		}
	});

	it('applies custom date format when date exists and format is specified', async () => {
		const fieldsInCollection: Field[] = [
			{
				collection: 'test',
				field: 'date_field',
				type: 'dateTime',
				name: 'Date',
				schema: null,
				meta: {
					id: 1,
					collection: 'test',
					field: 'date_field',
					group: null,
					hidden: false,
					interface: 'datetime',
					display: 'datetime',
					display_options: { format: 'eee - MMM/dd - yyyy' },
					options: {},
					readonly: false,
					required: false,
					sort: null,
					special: null,
					translations: null,
					width: null,
					note: null,
					conditions: null,
					validation: null,
					validation_message: null,
				},
			},
		];

		const wrapper = mount(Kanban, {
			global: {
				plugins: [i18n, pinia, router],
				directives: {
					tooltip: vi.fn(),
				},
				components: {
					'display-datetime': DisplayDateTime,
				},
				stubs: {
					'v-menu': true,
					'v-dialog': true,
				},
				mocks: {
					$t: (key: string) => key,
					$n: (val: number) => val.toString(),
				},
				config: {
					warnHandler: () => null,
				},
			},
			props: {
				itemCount: 1,
				totalCount: 1,
				isFiltered: false,
				limit: 100,
				fieldsInCollection,
				primaryKeyField: { field: 'id' },
				groupedItems: [
					{
						id: 'group1',
						title: 'Test Group',
						sort: 0,
						items: [
							{
								id: '7b0285f0-ca18-48a2-ba41-87b0b5b6bbea',
								title: 'My Title',
								text: 'my description',
								date: '2025-03-20T12:23:00',
								dateType: 'dateTime',
								sort: 0,
								users: [],
								item: {},
							},
						],
					},
				],
				change: vi.fn(),
				changeGroupSort: vi.fn(),
				addGroup: vi.fn(),
				editGroup: vi.fn(),
				deleteGroup: vi.fn(),
				canReorderGroups: false,
				canReorderItems: false,
				canUpdateGroupTitle: false,
				canDeleteGroups: false,
				selection: [],
				onClick: vi.fn(),
				layoutOptions: {
					groupField: 'not_important',
					groupTitle: 'not_important',
					crop: false,
					showUngrouped: false,
					groupOrder: { groupField: 'not_important', sortMap: {} },
					dateField: 'date_field',
				},
				resetPresetAndRefresh: vi.fn(),
			},
		});

		await flushPromises();

		expect(wrapper.html()).toContain('Thu - Mar/20 - 2025');
	});

	it('applies default date format when no format is specified', async () => {
		const fieldsInCollection: Field[] = [
			{
				collection: 'test',
				field: 'date_field',
				type: 'dateTime',
				name: 'Date',
				schema: null,
				meta: {
					id: 1,
					collection: 'test',
					field: 'date_field',
					group: null,
					hidden: false,
					interface: 'datetime',
					display: null,
					display_options: null,
					options: {},
					readonly: false,
					required: false,
					sort: null,
					special: null,
					translations: null,
					width: null,
					note: null,
					conditions: null,
					validation: null,
					validation_message: null,
				},
			},
		];

		const wrapper = mount(Kanban, {
			global: {
				plugins: [i18n, pinia, router],
				directives: {
					tooltip: vi.fn(),
				},
				components: {
					'display-datetime': DisplayDateTime,
				},
				stubs: {
					'v-menu': true,
					'v-dialog': true,
				},
				mocks: {
					$t: (key: string) => key,
					$n: (val: number) => val.toString(),
				},
				config: {
					warnHandler: () => null,
				},
			},
			props: {
				itemCount: 1,
				totalCount: 1,
				isFiltered: false,
				limit: 100,
				fieldsInCollection,
				primaryKeyField: { field: 'id' },
				groupedItems: [
					{
						id: 'group1',
						title: 'Test Group',
						sort: 0,
						items: [
							{
								id: '7b0285f0-ca18-48a2-ba41-87b0b5b6bbea',
								title: 'My Title',
								text: 'my description',
								date: '2025-03-20T12:23:00',
								dateType: 'dateTime',
								sort: 0,
								users: [],
								item: {},
							},
						],
					},
				],
				change: vi.fn(),
				changeGroupSort: vi.fn(),
				addGroup: vi.fn(),
				editGroup: vi.fn(),
				deleteGroup: vi.fn(),
				canReorderGroups: false,
				canReorderItems: false,
				canUpdateGroupTitle: false,
				canDeleteGroups: false,
				selection: [],
				onClick: vi.fn(),
				layoutOptions: {
					groupField: 'not_important',
					groupTitle: 'not_important',
					crop: false,
					showUngrouped: false,
					groupOrder: { groupField: 'not_important', sortMap: {} },
					dateField: 'date_field',
				},
				resetPresetAndRefresh: vi.fn(),
			},
		});

		await flushPromises();

		expect(wrapper.html()).toContain('Mar 20, 2025 12:23PM');
	});
});
