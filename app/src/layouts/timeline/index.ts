import { defineLayout } from '@directus/shared/utils';
import TimelineLayout from './timeline.vue';
import TimelineOptions from './options.vue';
import TimelineSidebar from './sidebar.vue';

import { useI18n } from 'vue-i18n';
import { toRefs, inject, computed, ref, watch } from 'vue';
import { useCollection, useFilterFields } from '@directus/shared/composables';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { useRelationsStore } from '@/stores/';

import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { useSync } from '@directus/shared/composables';
import { LayoutOptions, LayoutQuery, Day, Event } from './types';
import { getRootPath } from '@/utils/get-root-path';
import api, { addTokenToURL } from '@/api';
import { AppFilter } from '@directus/shared/types';

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
		const relationsStore = useRelationsStore();

		const layoutOptions = useSync(props, 'layoutOptions', emit);
		const layoutQuery = useSync(props, 'layoutQuery', emit);
		const filters = useSync(props, 'filters', emit);
		const searchQuery = useSync(props, 'searchQuery', emit);

		const { collection } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const {fieldGroups} = useFilterFields(fieldsInCollection, {
			date: field => field.type === 'date' || field.type === 'dateTime' || field.type === 'timestamp',
			time: field => field.type === 'time',
			user: field => {
				const related = relationsStore.relations.find(
					(relation) => relation.collection === props.collection &&
					relation.field === field.field &&
					relation.related_collection === 'directus_users'
				);

				return related !== undefined
			}
		})

		const { title, dateField, timeField, userField } = useLayoutOptions();
		const { sort, page, fields, filter } = useLayoutQuery();

		const {days} = useDays()

		const timeFieldRequired = computed(() => {
			const field = fieldsInCollection.value.find(field => field.field === dateField.value)

			return field?.type === 'date'
		})

		return {
			page,
			fieldsInCollection,
			primaryKeyField,
			title,
			getLinkForItem,
			sort,
			info,
			dateField, timeField, userField,
			fieldGroups,
			timeFieldRequired,
			days
		};

		function parseUrl(file: Record<string, any>) {
			if (!file || !file.type) return null;
			if (file.type.startsWith('image') === false) return null;
			if (file.type.includes('svg')) return null;

			let key = 'system-medium-cover'

			const url = getRootPath() + `assets/${file.id}?key=${key}&modified=${file.modified_on}`;
			return addTokenToURL(url);
		}

		function useLayoutOptions() {
			const dateField = createViewOption<string | null>('dateField', fieldGroups.value.date?.[0]?.field ?? null);
			const timeField = createViewOption<string | null>('timeField', fieldGroups.value.time?.[0]?.field ?? null);
			const userField = createViewOption<string | null>('userField', fieldGroups.value.user?.[0]?.field ?? null);
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

		function useDays() {
			const days = ref<Day[]>([])
			const loading = ref(false)

			watch([page, collection], () => {
				fetchDays()
			}, {immediate: true})

			return {days, fetchDays}

			async function fetchDays() {
				const collectionPath = collection.value?.startsWith('directus_') ? collection.value.substr(9) : `items/${collection.value}`

				loading.value = true

				const result = await api.get(`/${collectionPath}`, {
					params: {
						filter,
						groupBy: `year(${dateField.value}),month(${dateField.value}),day(${dateField.value})`,
						'aggregate[count]': '*',
						limit: -1
					}
				})

				days.value = (result.data.data as Record<string, any>[]).map(day => ({
					year: day[`${dateField.value}_year`],
					month: day[`${dateField.value}_month`],
					day: day[`${dateField.value}_day`],
					event_count: day['count']
				}))

				loading.value = false
			}
		}

		function useLayoutQuery() {
			const page = ref(1)

			const sort = computed(() => {
				return '-' + (dateField.value ?? primaryKeyField.value?.field) + (timeField.value ?? '')
			});

			const filter = computed(() => {
				return [
					...filters.value,
					{
						field: dateField.value,
						operator: 'between',
						value: `$NOW(${(page.value - 2) * 30} days),$NOW(${(page.value - 1) * 30} days)`
					}
				] as AppFilter[]
			})

			const fields = computed<string[]>(() => {
				if (!primaryKeyField.value || !props.collection) return [];
				const fields = [primaryKeyField.value.field];

				if(userField.value) {
					fields.push(`${userField.value}.avatar.modified_on`)
					fields.push(`${userField.value}.avatar.type`)
					fields.push(`${userField.value}.avatar.filename_disk`)
					fields.push(`${userField.value}.avatar.storage`)
					fields.push(`${userField.value}.avatar.id`)
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

			return { sort, page, fields, filter };
		}

		function getLinkForItem(item: Record<string, any>) {
			if (!primaryKeyField.value) return;
			return `/collections/${props.collection}/${encodeURIComponent(item[primaryKeyField.value.field])}`;
		}
	},
});
