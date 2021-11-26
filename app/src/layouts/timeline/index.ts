import { defineLayout } from '@directus/shared/utils';
import TimelineLayout from './timeline.vue';
import TimelineOptions from './options.vue';
import TimelineSidebar from './sidebar.vue';

import { toRefs, computed, ref, watch, Ref } from 'vue';
import { useCollection, useFilterFields } from '@directus/shared/composables';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { useRelationsStore } from '@/stores/';

import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { useSync } from '@directus/shared/composables';
import { LayoutOptions, LayoutQuery, Day, Event } from './types';
import { getRootPath } from '@/utils/get-root-path';
import api, { addTokenToURL } from '@/api';
import { getEndpoint } from '@/utils/get-endpoint';
import { Filter } from '@directus/shared/types';

export type UseEvents = (
	day: Ref<Day>,
	limit: Ref<number>,
	visible: Ref<boolean>
) => { events: Ref<Event[]>; loading: Ref<boolean> };

export default defineLayout<LayoutOptions, LayoutQuery>({
	id: 'timeline',
	name: '$t:layouts.timeline.timeline',
	icon: 'format_list_bulleted',
	component: TimelineLayout,
	slots: {
		options: TimelineOptions,
		sidebar: TimelineSidebar,
		actions: () => undefined,
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();

		const layoutOptions = useSync(props, 'layoutOptions', emit);

		const { collection, filter } = toRefs(props);

		const { info, primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const { fieldGroups } = useFilterFields(fieldsInCollection, {
			date: (field) => field.type === 'date' || field.type === 'dateTime' || field.type === 'timestamp',
			time: (field) => field.type === 'time',
			user: (field) => {
				const related = relationsStore.relations.find(
					(relation) =>
						relation.collection === props.collection &&
						relation.field === field.field &&
						relation.related_collection === 'directus_users'
				);

				return related !== undefined;
			},
		});

		const { title, dateField, timeField, userField } = useLayoutOptions();
		const { sort, page, fields } = useLayoutQuery();

		const { days, loading } = useDays();

		const timeFieldRequired = computed(() => {
			const field = fieldsInCollection.value.find((field) => field.field === dateField.value);
			return field?.type === 'date';
		});

		return {
			page,
			fieldsInCollection,
			primaryKeyField,
			title,
			sort,
			info,
			dateField,
			timeField,
			userField,
			fieldGroups,
			timeFieldRequired,
			days,
			useEvents,
			loading,
		};

		function parseUrl(file: Record<string, any>) {
			if (!file || !file.type) return null;
			if (file.type.startsWith('image') === false) return null;
			if (file.type.includes('svg')) return null;

			const key = 'system-medium-cover';

			const url = getRootPath() + `assets/${file.id}?key=${key}&modified=${file.modified_on}`;
			return addTokenToURL(url);
		}

		function useLayoutOptions() {
			const dateField = createViewOption<string | null>('dateField', fieldGroups.value.date?.[0]?.field ?? null);
			const timeField = createViewOption<string | null>('timeField', null);
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
			const days = ref<Day[]>([]);
			const loading = ref(false);

			const daysFilter = computed(() => {
				if (!dateField.value) {
					return filter.value;
				}

				const daysRange = {
					[dateField.value]: {
						_between: [`$NOW(${(page.value - 2) * 30 + 1} days)`, `$NOW(${(page.value - 1) * 30} days)`],
					},
				};

				return {
					_and: [filter.value, daysRange],
				};
			});

			watch(
				[page, collection, daysFilter],
				() => {
					fetchDays();
				},
				{ immediate: true }
			);

			return { days, fetchDays, loading };

			async function fetchDays() {
				loading.value = true;

				const result = await api.get(getEndpoint(collection.value!), {
					params: {
						groupBy: [`year(${dateField.value})`, `month(${dateField.value})`, `day(${dateField.value})`],
						aggregate: {
							count: '*',
						},
						limit: -1,
						// sort: sort.value,
						filter: daysFilter.value,
					},
				});

				days.value = (result.data.data as Record<string, any>[]).map((day) => ({
					year: day[`${dateField.value}_year`],
					month: day[`${dateField.value}_month`],
					day: day[`${dateField.value}_day`],
					event_count: day['count'],
				}));

				loading.value = false;
			}
		}

		function useEvents(day: Ref<Day>, limit: Ref<number>, visible: Ref<boolean>): UseEvents {
			const loading = ref(false);
			const events = ref<Event[]>([]);

			const eventsFilter = computed(() => {
				return {
					_and: [
						filter.value,
						{
							[`year(${dateField.value})`]: {
								_eq: day.value.year,
							},
						},
						{
							[`month(${dateField.value})`]: {
								_eq: day.value.month,
							},
						},
						{
							[`day(${dateField.value})`]: {
								_eq: day.value.day,
							},
						},
					],
				} as Filter;
			});

			watch([collection, day, fields, eventsFilter], () => {
				fetchEvents(true);
			});

			watch([limit, visible], () => {
				fetchEvents(false);
			});

			return { events, loading };

			async function fetchEvents(reload: boolean) {
				if (visible.value === false) return;
				if (limit.value === events.value.length && reload === false) return;

				loading.value = true;

				const offset = reload ? 0 : events.value.length;
				const eventlimit = reload ? limit.value : limit.value - events.value.length;

				const result = await api.get(getEndpoint(collection.value!), {
					params: {
						offset,
						limit: eventlimit,
						fields: fields.value,
						sort: sort.value,
						filter: eventsFilter.value,
					},
				});

				const dateF = dateField.value;
				const timeF = timeField.value;
				const pkField = primaryKeyField.value?.field;
				const localTitle = title.value;

				if (dateF === null || pkField === undefined || localTitle === null) return;

				if (reload) {
					events.value = [];
				}

				(result.data.data as Record<string, any>[]).forEach((event) => {
					const user = userField.value ? event[userField.value] : undefined;

					if (user !== undefined && user.avatar) {
						user.image = parseUrl(user.avatar);
					}

					const date = new Date(timeFieldRequired.value && timeF ? event[dateF] + ' ' + event[timeF] : event[dateF]);

					events.value.push({
						id: event[pkField],
						title: localTitle,
						time: date,
						user,
						item: event,
					});
				});

				loading.value = false;
			}
		}

		function useLayoutQuery() {
			const page = ref(1);

			const sort = computed(() => {
				return '-' + (dateField.value ?? primaryKeyField.value?.field);
			});

			const fields = computed<string[]>(() => {
				if (!primaryKeyField.value || !props.collection) return [];
				const fields = [primaryKeyField.value.field];

				if (userField.value) {
					fields.push(`${userField.value}.avatar.modified_on`);
					fields.push(`${userField.value}.avatar.type`);
					fields.push(`${userField.value}.avatar.filename_disk`);
					fields.push(`${userField.value}.avatar.storage`);
					fields.push(`${userField.value}.avatar.id`);
				}

				if (dateField.value) {
					fields.push(dateField.value);
				}

				if ((timeFieldRequired.value, timeField.value)) {
					fields.push(timeField.value);
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

			return { sort, page, fields };
		}
	},
});
