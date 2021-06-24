import { defineLayout } from '@/layouts/define';
import CalendarLayout from './calendar.vue';
import CalendarOptions from './options.vue';
import CalendarSidebar from './sidebar.vue';
import CalendarActions from './actions.vue';

import { useI18n } from 'vue-i18n';
import { Calendar, CalendarOptions as FullCalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { ref, watch, toRefs, computed, Ref } from 'vue';
import { useAppStore } from '@/stores/app';
import { Field } from '@/types';
import { Item, Filter } from '@directus/shared/types';
import useItems from '@/composables/use-items';
import useCollection from '@/composables/use-collection';
import { formatISO } from 'date-fns';
import { router } from '@/router';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import getFullcalendarLocale from '@/utils/get-fullcalendar-locale';

type LayoutOptions = {
	template?: string;
	startDateField?: string;
	endDateField?: string;
	viewInfo?: {
		type: string;
		startDateStr: string;
	};
};

export default defineLayout<LayoutOptions>({
	id: 'calendar',
	name: '$t:layouts.calendar.calendar',
	icon: 'event',
	component: CalendarLayout,
	slots: {
		options: CalendarOptions,
		sidebar: CalendarSidebar,
		actions: CalendarActions,
	},
	setup(props) {
		const { t, locale } = useI18n();

		const calendarEl = ref<HTMLElement>();
		const calendar = ref<Calendar>();

		const appStore = useAppStore();

		const { collection, searchQuery, layoutOptions, filters } = toRefs(props);

		const { primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const dateFields = computed(() =>
			fieldsInCollection.value.filter((field: Field) => {
				return ['timestamp', 'dateTime', 'date'].includes(field.type);
			})
		);

		const filtersWithCalendarView = computed<Filter[]>(() => {
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

		const template = computed({
			get() {
				return layoutOptions.value?.template;
			},
			set(newTemplate: string | undefined) {
				layoutOptions.value = {
					...(layoutOptions.value || {}),
					template: newTemplate,
				};
			},
		});

		const viewInfo = computed({
			get() {
				return layoutOptions.value?.viewInfo;
			},
			set(newViewInfo: LayoutOptions['viewInfo']) {
				layoutOptions.value = {
					...(layoutOptions.value || {}),
					viewInfo: newViewInfo,
				};
			},
		});

		const startDateField = computed({
			get() {
				return layoutOptions.value?.startDateField;
			},
			set(newStartDateField: string | undefined) {
				layoutOptions.value = {
					...(layoutOptions.value || {}),
					startDateField: newStartDateField,
				};
			},
		});

		const startDateFieldInfo = computed(() => {
			return fieldsInCollection.value.find((field: Field) => field.field === startDateField.value);
		});

		const endDateField = computed({
			get() {
				return layoutOptions.value?.endDateField;
			},
			set(newEndDateField: string | undefined) {
				layoutOptions.value = {
					...(layoutOptions.value || {}),
					endDateField: newEndDateField,
				};
			},
		});

		const endDateFieldInfo = computed(() => {
			return fieldsInCollection.value.find((field: Field) => field.field === endDateField.value);
		});

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems } = useItems(
			collection,
			{
				sort: computed(() => primaryKeyField.value?.field || ''),
				page: ref(1),
				limit: ref(-1),
				fields: computed(() => {
					if (!primaryKeyField.value) return [];

					const fields = [primaryKeyField.value.field];
					if (template.value) fields.push(...getFieldsFromTemplate(template.value));
					if (startDateField.value) fields.push(startDateField.value);
					if (endDateField.value) fields.push(endDateField.value);
					return fields;
				}),
				filters: filtersWithCalendarView,
				searchQuery: searchQuery,
			},
			false
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
				contentHeight: 800,
				nextDayThreshold: '01:00:00',
				plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
				initialView: viewInfo.value?.type ?? 'dayGridMonth',
				headerToolbar: {
					left: 'prevYear,prev,next,nextYear today',
					center: 'title',
					right: 'dayGridMonth,dayGridWeek,dayGridDay,listWeek',
				},
				events: events.value,
				initialDate: viewInfo.value?.startDateStr ?? formatISO(new Date()),
				eventClick(info) {
					if (!collection.value) return;

					const primaryKey = info.event.id;
					const endpoint = collection.value.startsWith('directus')
						? collection.value.substring(9)
						: `/collections/${collection.value}`;
					router.push(`${endpoint}/${primaryKey}`);
				},
				async eventChange(info) {
					if (!collection.value || !startDateField.value || !startDateFieldInfo.value) return;

					const itemChanges: Partial<Item> = {
						[startDateField.value]: adjustForType(info.event.startStr, startDateFieldInfo.value.type),
					};

					if (endDateField.value && endDateFieldInfo.value && info.event.endStr) {
						itemChanges[endDateField.value] = adjustForType(info.event.endStr, endDateFieldInfo.value.type);
					}

					const endpoint = collection.value.startsWith('directus')
						? collection.value.substring(9)
						: `/items/${collection.value}`;

					try {
						await api.patch(`${endpoint}/${info.event.id}`, itemChanges);
					} catch (err) {
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

		watch(
			fullFullCalendarOptions,
			() => {
				if (calendar.value) {
					calendar.value.pauseRendering();
					calendar.value.resetOptions(fullFullCalendarOptions.value);
					calendar.value.resumeRendering();
				}
			},
			{ deep: true, immediate: true }
		);

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
			calendarEl,
			items,
			loading,
			error,
			totalPages,
			itemCount,
			totalCount,
			changeManualSort,
			getItems,
			filtersWithCalendarView,
			template,
			dateFields,
			startDateField,
			endDateField,
			showingCount,
			createCalendar,
			destroyCalendar,
		};

		function createCalendar() {
			calendar.value = new Calendar(calendarEl.value!, fullFullCalendarOptions.value);

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

			return {
				id: item[primaryKeyField.value.field],
				title: renderPlainStringTemplate(template.value || `{{ ${primaryKeyField.value.field} }}`, item) || undefined,
				start: item[startDateField.value],
				end: endDateField.value ? item[endDateField.value] : null,
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
