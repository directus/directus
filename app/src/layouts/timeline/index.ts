import { defineLayout } from '@directus/shared/utils';
import TimelineLayout from './timeline.vue';
import TimelineOptions from './options.vue';
import TimelineSidebar from './sidebar.vue';

import { useI18n } from 'vue-i18n';
import { toRefs, inject, computed, ref } from 'vue';
import { useCollection, useFilterFields } from '@directus/shared/composables';
import { useItems } from '@directus/shared/composables';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { useRelationsStore } from '@/stores/';

import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { useSync } from '@directus/shared/composables';
import { LayoutOptions, LayoutQuery, Day, Event } from './types';
import user from '@/displays/user';
import { getRootPath } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';

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

		const timeFieldRequired = computed(() => {
			const field = fieldsInCollection.value.find(field => field.field === dateField.value)

			return field?.type === 'date'
		})

		const days = computed(() => {
			const days: Record<string, Day> = {}

			const dateF = dateField.value
			const timeF = timeField.value
			const pkField = primaryKeyField.value?.field
			const localTitle = title.value

			if(dateF === null || pkField === undefined || localTitle === null) return []

			items.value.forEach(item => {
				const date = new Date(item[dateF])
				const day = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

				if(day in days === false) days[day] = {
					date: date,
					events: []
				}

				const user = userField.value ? item[userField.value] : undefined

				if(user !== undefined && user.avatar) {
					user.image = parseUrl(user.avatar)
				}

				const time = timeF !== null? new Date(item[timeF]) : date

				days[day].events.push({
					id: item[pkField],
					title: localTitle,
					time,
					user,
					item
				})
			})

			return Object.values(days)
		})

		return {
			days,
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
			refresh,
			resetPresetAndRefresh,
			dateField, timeField, userField,
			fieldGroups,
			timeFieldRequired
		};

		async function resetPresetAndRefresh() {
			await props?.resetPreset?.();
			refresh();
		}

		function parseUrl(file: Record<string, any>) {
			if (!file || !file.type) return null;
			if (file.type.startsWith('image') === false) return null;
			if (file.type.includes('svg')) return null;

			let key = 'system-medium-cover'

			const url = getRootPath() + `assets/${file.id}?key=${key}&modified=${file.modified_on}`;
			return addTokenToURL(url);
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

		function useLayoutQuery() {
			const page = computed({
				get() {
					return layoutQuery.value?.page || 1;
				},
				set(newPage: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: newPage,
					};
				},
			});

			const sort = computed(() => {
				return '-' + (dateField.value ?? primaryKeyField.value?.field) + (timeField.value ?? '')
			});

			const limit = computed({
				get() {
					return layoutQuery.value?.limit || 25;
				},
				set(newLimit: number) {
					layoutQuery.value = {
						...(layoutQuery.value || {}),
						page: 1,
						limit: newLimit,
					};
				},
			});

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

			return { sort, limit, page, fields };
		}

		function getLinkForItem(item: Record<string, any>) {
			if (!primaryKeyField.value) return;
			return `/collections/${props.collection}/${encodeURIComponent(item[primaryKeyField.value.field])}`;
		}
	},
});
