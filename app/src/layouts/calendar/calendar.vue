<template>
	<div class="calendar-layout">
		<div ref="calendarEl" />

		<portal to="layout-options">
			<!-- <div class="field">
				<div class="type-label">{{ $t('layouts.tabular.spacing') }}</div>
				<v-select
					v-model="tableSpacing"
					:items="[
						{
							text: $t('layouts.tabular.compact'),
							value: 'compact',
						},
						{
							text: $t('layouts.tabular.cozy'),
							value: 'cozy',
						},
						{
							text: $t('layouts.tabular.comfortable'),
							value: 'comfortable',
						},
					]"
				/>
			</div> -->
		</portal>
	</div>
</template>

<script lang="ts">
import '@fullcalendar/core/vdom';
import { Calendar, CalendarOptions, ViewApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import {
	defineComponent,
	onMounted,
	onUnmounted,
	ref,
	watch,
	PropType,
	Ref,
	toRefs,
	computed,
} from '@vue/composition-api';
import { useAppStore } from '@/stores/app';
import { Item, Filter } from '@/types';
import useItems from '@/composables/use-items';
import useSync from '@/composables/use-sync';
import useCollection from '@/composables/use-collection';
import { formatISO } from 'date-fns';

type layoutOptions = {};

type layoutQuery = {};

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		selection: {
			type: Array as PropType<Item[]>,
			default: undefined,
		},
		layoutOptions: {
			type: Object as PropType<layoutOptions>,
			default: () => ({}),
		},
		layoutQuery: {
			type: Object as PropType<layoutQuery>,
			default: () => ({}),
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const calendarEl = ref<HTMLElement>();
		const calendar = ref<Calendar>();

		const appStore = useAppStore();

		const { collection } = toRefs(props);

		const _layoutOptions: Ref<any> = useSync(props, 'layoutOptions', emit);
		const _layoutQuery: Ref<any> = useSync(props, 'layoutQuery', emit);
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { info, primaryKeyField, fields: fieldsInCollection, sortField } = useCollection(collection);

		const filtersWithCalendarView = computed<Filter[]>(() => {
			if (!calendar.value) return _filters.value;

			return [
				..._filters.value,
				{
					key: 'start_date',
					field: 'start_date', // @TODO dynamic
					operator: 'gte',
					value: formatISO(calendar.value.view.currentStart),
					hidden: true,
				},
				{
					key: 'end_date',
					field: 'start_date', // @TODO dynamic
					operator: 'lte',
					value: formatISO(calendar.value.view.currentEnd),
					hidden: true,
				},
			];
		});

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems } = useItems(
			collection,
			{
				sort: ref('name'),
				limit: ref(-1),
				page: ref(1),
				// @TODO based on options
				fields: ref(['name', 'start_date', 'end_date']),
				filters: filtersWithCalendarView,
				searchQuery: _searchQuery,
			},
			false
		);

		const fullCalendarOptions = computed<CalendarOptions>(() => ({
			plugins: [dayGridPlugin],
			initialView: 'dayGridMonth',
			// headerToolbar: {
			// 	start: '',
			// 	center: '',
			// 	end: '',
			// },
			headerToolbar: {
				left: 'prevYear,prev,next,nextYear today',
				center: 'title',
				right: 'dayGridMonth,dayGridWeek,dayGridDay',
			},
			events: items.value?.map((item: Item) => parseEvent(item)) || [],
		}));

		onMounted(() => {
			calendar.value = new Calendar(calendarEl.value!, fullCalendarOptions.value);
			calendar.value.render();
		});

		// Make sure to re-render the size of the calendar when the available space changes due to the
		// sidebar being manipulated
		watch(
			() => appStore.state.sidebarOpen,
			() => setTimeout(() => calendar.value?.updateSize(), 300)
		);

		watch(fullCalendarOptions, () => {
			if (calendar.value) {
				calendar.value.pauseRendering();
				calendar.value.resetOptions(fullCalendarOptions.value);
				calendar.value.resumeRendering();
			}
		});

		onUnmounted(() => {
			calendar.value?.destroy();
		});

		function parseEvent(item: Item) {
			return {
				// @TODO based on options
				title: item.name,
				start: item.start_date,
				end: item.end_date,
			};
		}

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
			fullCalendarOptions,
			filtersWithCalendarView,
		};
	},
});
</script>

<style lang="scss" scoped>
.calendar-layout {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
