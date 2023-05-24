import api from '@/api';
import { router } from '@/router';
import { useAppStore } from '@/stores/app';
import { useServerStore } from '@/stores/server';
import { getFullcalendarLocale } from '@/utils/get-fullcalendar-locale';
import { getItemRoute } from '@/utils/get-item-route';
import { renderDisplayStringTemplate } from '@/utils/render-string-template';
import { saveAsCSV } from '@/utils/save-as-csv';
import { syncRefProperty } from '@/utils/sync-ref-property';
import { unexpectedError } from '@/utils/unexpected-error';
import { useCollection, useItems, useSync } from '@directus/composables';
import { Field, Item } from '@directus/types';
import { defineLayout, getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { Calendar, EventInput, CalendarOptions as FullCalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { format, formatISO, isValid, parse } from 'date-fns';
import { Ref, computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import CalendarActions from './actions.vue';
import CalendarLayout from './calendar.vue';
import CalendarOptions from './options.vue';
import { LayoutOptions } from './types';

export default defineLayout<LayoutOptions>({
	id: 'calendar',
	name: '$t:layouts.calendar.calendar',
	icon: 'event',
	component: CalendarLayout,
	slots: {
		options: CalendarOptions,
		sidebar: () => undefined,
		actions: CalendarActions,
	},
	setup(props, { emit }) {
		const { t, locale } = useI18n();

		const calendar = ref<Calendar>();

		const appStore = useAppStore();
		const { info } = useServerStore();

		const selection = useSync(props, 'selection', emit);
		const layoutOptions = useSync(props, 'layoutOptions', emit);

		const { collection, filter, search } = toRefs(props);

		const { primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const dateFields = computed(() =>
			fieldsInCollection.value.filter((field: Field) => {
				return ['timestamp', 'dateTime', 'date'].includes(field.type);
			})
		);

		const calendarFilter = computed(() => {
			if (!calendar.value || !startDateField.value) {
				return;
			}

			const start = formatISO(calendar.value.view.activeStart);
			const end = formatISO(calendar.value.view.activeEnd);
			const startsHere = { [startDateField.value]: { _between: [start, end] } };

			if (!endDateField.value) {
				return startsHere;
			}

			const endsHere = { [endDateField.value]: { _between: [start, end] } };
			const startsBefore = { [startDateField.value]: { _lte: start } };
			const endsAfter = { [endDateField.value]: { _gte: end } };
			const overlapsHere = { _and: [startsBefore, endsAfter] };
			return { _or: [startsHere, endsHere, overlapsHere] };
		});

		const filterWithCalendarView = computed(() => {
			if (!calendarFilter.value) return filter.value;
			if (!filter.value) return null;

			return {
				_and: [filter.value, calendarFilter.value],
			};
		});

		const template = syncRefProperty(layoutOptions, 'template', undefined);
		const viewInfo = syncRefProperty(layoutOptions, 'viewInfo', undefined);

		const startDateField = syncRefProperty(layoutOptions, 'startDateField', undefined);

		const startDateFieldInfo = computed(() => {
			return fieldsInCollection.value.find((field: Field) => field.field === startDateField.value);
		});

		const endDateField = syncRefProperty(layoutOptions, 'endDateField', undefined);

		const endDateFieldInfo = computed(() => {
			return fieldsInCollection.value.find((field: Field) => field.field === endDateField.value);
		});

		const firstDay = syncRefProperty(layoutOptions, 'firstDay', undefined);

		const queryFields = computed(() => {
			if (!primaryKeyField.value) return [];

			const fields = [primaryKeyField.value.field];
			if (template.value) fields.push(...getFieldsFromTemplate(template.value));
			if (startDateField.value) fields.push(startDateField.value);
			if (endDateField.value) fields.push(endDateField.value);
			return fields;
		});

		const limit = info.queryLimit?.max && info.queryLimit.max !== -1 ? info.queryLimit.max : 10000;

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems } = useItems(
			collection,
			{
				sort: computed(() => [primaryKeyField.value?.field || '']),
				page: ref(1),
				limit: ref(limit),
				fields: queryFields,
				filter: filterWithCalendarView,
				search: search,
			}
		);

		const events: Ref<EventInput> = computed(
			() => items.value.map((item: Item) => parseEvent(item)).filter((e: EventInput | null) => e) || []
		);

		const fullFullCalendarOptions = computed<FullCalendarOptions>(() => {
			const options: FullCalendarOptions = {
				editable: true,
				eventStartEditable: true,
				eventResizableFromStart: true,
				eventDurationEditable: true,
				dayMaxEventRows: true,
				height: '100%',
				firstDay: firstDay.value ?? 0,
				nextDayThreshold: '01:00:00',
				plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
				initialView: viewInfo.value?.type ?? 'dayGridMonth',
				headerToolbar: {
					left: 'prevYear,prev,next,nextYear today',
					center: 'title',
					right: 'dayGridMonth,dayGridWeek,dayGridDay,listWeek',
				},
				views: {
					dayGridMonth: {
						eventTimeFormat: {
							hour: 'numeric',
							minute: '2-digit',
							meridiem: 'narrow',
						},
					},
				},
				events: events.value,
				initialDate: viewInfo.value?.startDateStr ?? formatISO(new Date()),
				eventClick(info) {
					if (!collection.value) return;

					if (props.selectMode || selection.value?.length > 0) {
						const item = items.value.find((item) => item[primaryKeyField.value!.field] == info.event.id);

						if (item) {
							const primaryKey = item[primaryKeyField.value!.field];

							if (selection.value.includes(primaryKey)) {
								selection.value = selection.value.filter((selected) => selected !== primaryKey);
							} else {
								selection.value = [...selection.value, primaryKey];
							}

							updateCalendar();
						}
					} else {
						const primaryKey = info.event.id;

						router.push(getItemRoute(collection.value, primaryKey));
					}
				},
				async eventChange(info) {
					if (!collection.value || !startDateField.value || !startDateFieldInfo.value) return;

					const itemChanges: Partial<Item> = {
						[startDateField.value]: adjustForType(info.event.startStr, startDateFieldInfo.value.type),
					};

					if (endDateField.value && endDateFieldInfo.value && info.event.endStr) {
						itemChanges[endDateField.value] = adjustForType(info.event.endStr, endDateFieldInfo.value.type);
					}

					const endpoint = getEndpoint(collection.value);

					try {
						await api.patch(`${endpoint}/${info.event.id}`, itemChanges);
					} catch (err: any) {
						unexpectedError(err);
					}
				},
			};

			if (startDateFieldInfo.value?.type === 'dateTime' || startDateFieldInfo.value?.type === 'timestamp') {
				options.headerToolbar = {
					...options.headerToolbar,
					right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
				};
			}

			return options;
		});

		// Make sure to re-render the size of the calendar when the available space changes due to the
		// sidebar being manipulated
		watch(
			() => appStore.sidebarOpen,
			() => setTimeout(() => calendar.value?.updateSize(), 300)
		);

		watch(fullFullCalendarOptions, () => updateCalendar(), { deep: true, immediate: true });

		watch(
			[calendar, locale],
			async () => {
				if (calendar.value) {
					const calendarLocale = await getFullcalendarLocale(locale.value);
					calendar.value.setOption('locale', calendarLocale);
				}
			},
			{ immediate: true }
		);

		const showingCount = computed(() => {
			if (!itemCount.value) return null;

			return t('item_count', itemCount.value);
		});

		return {
			items,
			loading,
			error,
			totalPages,
			itemCount,
			totalCount,
			changeManualSort,
			getItems,
			filterWithCalendarView,
			template,
			dateFields,
			startDateField,
			endDateField,
			firstDay,
			showingCount,
			createCalendar,
			destroyCalendar,
			download,
		};

		function download() {
			if (!collection.value) return;
			saveAsCSV(collection.value, queryFields.value, items.value);
		}

		function updateCalendar() {
			if (calendar.value) {
				calendar.value.pauseRendering();
				calendar.value.resetOptions(fullFullCalendarOptions.value);
				calendar.value.resumeRendering();
				calendar.value.render();
			}
		}

		function createCalendar(calendarElement: HTMLElement) {
			calendar.value = new Calendar(calendarElement, fullFullCalendarOptions.value);

			calendar.value.on('datesSet', (args) => {
				viewInfo.value = {
					type: args.view.type,
					startDateStr: formatISO(args.view.currentStart),
				};
			});

			calendar.value.render();
		}

		function destroyCalendar() {
			calendar.value?.destroy();
		}

		function parseEvent(item: Item): EventInput | null {
			if (!startDateField.value || !primaryKeyField.value) return null;

			let endDate: string | undefined = undefined;

			// If the end date is a date-field (so no time), we can safely assume the item is meant to
			// last all day
			const allDay = endDateFieldInfo.value && endDateFieldInfo.value.type === 'date';

			if (endDateField.value) {
				const date = parse(item[endDateField.value], 'yyyy-MM-dd', new Date());

				if (allDay && isValid(date)) {
					// FullCalendar uses exclusive end moments, so we'll have to increment the end date by 1 to get the
					// expected result in the calendar
					date.setDate(date.getDate() + 1);
					endDate = format(date, 'yyyy-MM-dd');
				} else {
					endDate = item[endDateField.value];
				}
			}

			const primaryKey = item[primaryKeyField.value.field];

			return {
				id: primaryKey,
				title:
					renderDisplayStringTemplate(
						collection.value!,
						template.value || `{{ ${primaryKeyField.value.field} }}`,
						item
					) || item[primaryKeyField.value.field],
				start: item[startDateField.value],
				end: endDate,
				allDay,
				className: selection.value.includes(primaryKey) ? 'selected' : undefined,
			};
		}

		function adjustForType(dateString: string, type: string) {
			if (type === 'dateTime') {
				return dateString.substring(0, 19);
			}

			return dateString;
		}
	},
});
