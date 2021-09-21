import { defineLayout } from '@directus/shared/utils';
import TimelineLayout from './timeline.vue';
import TimelineOptions from './options.vue';
import TimelineSidebar from './sidebar.vue';

import { useI18n } from 'vue-i18n';
import { toRefs, inject, computed, ref } from 'vue';
import { useCollection } from '@directus/shared/composables';
import { useItems } from '@directus/shared/composables';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { useRelationsStore } from '@/stores/';

import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { useSync } from '@directus/shared/composables';
import { LayoutOptions, LayoutQuery } from './types';

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'timeline',
	name: '$t:layouts.timeline.timeline',
	icon: 'format_list_bulleted',
	component: TimelineLayout,
	slots: {
		options: TimelineOptions,
		sidebar: TimelineSidebar,
		actions: () => {},
	},
	setup(props, { emit }) {
		const { t, n } = useI18n();

		const relationsStore = useRelationsStore();

		const mainElement = inject('main-element', ref<Element | null>(null));

		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);
		const filters = useSync(props, 'filters', emit);
		const searchQuery = useSync(props, 'searchQuery', emit);

		const { collection } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const fileFields = computed(() => {
			return fieldsInCollection.value.filter((field) => {
				if (field.field === '$thumbnail') return true;

				const relation = relationsStore.relations.find((relation) => {
					return (
						relation.collection === props.collection &&
						relation.field === field.field &&
						relation.related_collection === 'directus_files'
					);
				});

				return !!relation;
			});
		});

		const { title, dateField, timeField, userField } = useLayoutOptions();
		const { sort, limit, page, fields } = useLayoutQuery();

		const { items, loading, error, totalPages, itemCount, totalCount, getItems } = useItems(collection, {
			sort,
			limit,
			page,
			fields: fields,
			filters: filters,
			searchQuery: searchQuery,
		});

		const showingCount = computed(() => {
			if ((itemCount.value || 0) < (totalCount.value || 0)) {
				if (itemCount.value === 1) {
					return t('one_filtered_item');
				}
				return t('start_end_of_count_filtered_items', {
					start: n((+page.value - 1) * limit.value + 1),
					end: n(Math.min(page.value * limit.value, itemCount.value || 0)),
					count: n(itemCount.value || 0),
				});
			}
			if (itemCount.value === 1) {
				return t('one_item');
			}
			return t('start_end_of_count_items', {
				start: n((+page.value - 1) * limit.value + 1),
				end: n(Math.min(page.value * limit.value, itemCount.value || 0)),
				count: n(itemCount.value || 0),
			});
		});

		return {
			items,
			loading,
			error,
			totalPages,
			page,
			toPage,
			itemCount,
			totalCount,
			fieldsInCollection,
			limit,
			primaryKeyField,
			fileFields,
			title,
			getLinkForItem,
			sort,
			info,
			showingCount,
			refresh,
			resetPresetAndRefresh,
			dateField, timeField, userField
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function refresh() {
			getItems();
		}

		function toPage(newPage: number) {
			page.value = newPage;
			mainElement.value?.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		}

		function useLayoutOptions() {
			const dateField = createViewOption<string | null>('dateField', null);
			const timeField = createViewOption<string | null>('timeField', null);
			const userField = createViewOption<string | null>('userField', null);
			const title = createViewOption<string | null>('title', null);

			return { dateField, timeField, userField, title };

			function createViewOption<T>(key: keyof LayoutOptions, defaultValue: any) {
				return computed<T>({
					get() {
						return layoutOptions.value?.[key] !== undefined ? layoutOptions.value?.[key] : defaultValue;
					},
					set(newValue: T) {
						layoutOptions.value = {
							...layoutOptions.value,
							[key]: newValue,
						};
					},
				});
			}
		}

		function useLayoutQuery() {
			const page = ref(1)

			const filtersInterval = computed(() => {
				if (!calendar.value || !startDateField.value) return filters.value;
	
				return [
					...filters.value,
					{
						key: 'start_date',
						field: startDateField.value,
						operator: 'gte',
						value: formatISO(calendar.value.view.currentStart),
						hidden: true,
					},
					{
						key: 'end_date',
						field: startDateField.value,
						operator: 'lte',
						value: formatISO(calendar.value.view.currentEnd),
						hidden: true,
					},
				];
			});

			const sort = computed({
				get() {
					return layoutQuery.value?.sort || primaryKeyField.value?.field || '';
				},
				set(newSort: string) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						sort: newSort,
					};
				},
			});

			const limit = ref(-1)

			const fields = computed<string[]>(() => {
				if (!primaryKeyField.value || !props.collection) return [];
				const fields = [primaryKeyField.value.field];

				if (imageSource.value) {
					fields.push(`${imageSource.value}.modified_on`);
					fields.push(`${imageSource.value}.type`);
					fields.push(`${imageSource.value}.filename_disk`);
					fields.push(`${imageSource.value}.storage`);
					fields.push(`${imageSource.value}.id`);
				}

				if (props.collection === 'directus_files' && imageSource.value === '$thumbnail') {
					fields.push('modified_on');
					fields.push('type');
				}

				if (sort.value) {
					const sortField = sort.value.startsWith('-') ? sort.value.substring(1) : sort.value;

					if (fields.includes(sortField) === false) {
						fields.push(sortField);
					}
				}

				const titleSubtitleFields: string[] = [];

				if (title.value) {
					titleSubtitleFields.push(...getFieldsFromTemplate(title.value));
				}

				return [...fields, ...adjustFieldsForDisplays(titleSubtitleFields, props.collection)];
			});

			return { sort, limit, page, fields };
		}

		function getLinkForItem(item: Record<string, any>) {
			if (!primaryKeyField.value) return;
			return `/collections/${props.collection}/${encodeURIComponent(item[primaryKeyField.value.field])}`;
		}
	},
});
