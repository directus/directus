import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Kanban from './kanban.vue';
import type { Field } from '@directus/types';
import { createI18n } from 'vue-i18n';
import DisplayDateTime from '@/displays/datetime/datetime.vue';

const i18n = createI18n({ legacy: false, missingWarn: false });

describe('Kanban layout', () => {
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
				plugins: [i18n],
				directives: {
					tooltip: vi.fn(),
				},
				components: {
					'display-datetime': DisplayDateTime,
				},
				mocks: {
					$t: (key: string) => key,
					$n: (val: number) => val.toString(),
				},
				config: {
					warnHandler: () => null,
					compilerOptions: {
						isCustomElement: (tag) => tag.startsWith('v-'),
					},
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
				plugins: [i18n],
				directives: {
					tooltip: vi.fn(),
				},
				components: {
					'display-datetime': DisplayDateTime,
				},
				mocks: {
					$t: (key: string) => key,
					$n: (val: number) => val.toString(),
				},
				config: {
					warnHandler: () => null,
					compilerOptions: {
						isCustomElement: (tag) => tag.startsWith('v-'),
					},
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
