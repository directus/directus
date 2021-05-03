<template>
	<div class="calendar-layout">
		<div ref="calendarEl" />

		<portal to="sidebar">
			<filter-sidebar-detail v-model="_filters" :collection="collection" :loading="loading" />
		</portal>

		<portal to="actions:prepend">
			<transition name="fade">
				<span class="item-count" v-if="itemCount">
					{{ showingCount }}
				</span>
			</transition>
		</portal>

		<portal to="layout-options">
			<div class="field">
				<div class="type-label">{{ $t('display_template') }}</div>
				<v-field-template :collection="collection" v-model="template" />
			</div>

			<div class="field">
				<div class="type-label">{{ $t('layouts.calendar.start_date_field') }}</div>
				<v-select show-deselect :items="dateFields" item-text="name" item-value="field" v-model="startDateField" />
			</div>

			<div class="field">
				<div class="type-label">{{ $t('layouts.calendar.end_date_field') }}</div>
				<v-select show-deselect :items="dateFields" item-text="name" item-value="field" v-model="endDateField" />
			</div>
		</portal>
	</div>
</template>

<script lang="ts">
/**
 * @TODO
 * - Dynamically switch between timeGrid and dayGrid based on datetime vs date
 * - Persist view (month/week/day) in layoutOptions
 * - Drag and Drop??
 * - Set contentHeight to auto based on month vs week view
 * - Make sure start_date / end_date are dynamic
 */

import '@fullcalendar/core/vdom';
import { Calendar, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
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
import { Item, Filter, Field } from '@/types';
import useItems from '@/composables/use-items';
import useSync from '@/composables/use-sync';
import useCollection from '@/composables/use-collection';
import { formatISO } from 'date-fns';
import router from '@/router';
import { renderPlainStringTemplate } from '@/utils/render-string-template';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import { i18n } from '@/lang';

type layoutOptions = {
	template?: string;
	startDateField?: string;
	endDateField?: string;
};

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
		const _filters = useSync(props, 'filters', emit);
		const _searchQuery = useSync(props, 'searchQuery', emit);

		const { primaryKeyField, fields: fieldsInCollection } = useCollection(collection);

		const dateFields = computed(() =>
			fieldsInCollection.value.filter((field: Field) => {
				return ['timestamp', 'dateTime', 'date'].includes(field.type);
			})
		);

		const filtersWithCalendarView = computed<Filter[]>(() => {
			if (!calendar.value || !startDateField.value) return _filters.value;

			return [
				..._filters.value,
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
				return _layoutOptions.value?.template;
			},
			set(newTemplate: string | null) {
				_layoutOptions.value = {
					...(_layoutOptions.value || {}),
					template: newTemplate,
				};
			},
		});

		const startDateField = computed({
			get() {
				return _layoutOptions.value?.startDateField;
			},
			set(newStartDateField: string | null) {
				_layoutOptions.value = {
					...(_layoutOptions.value || {}),
					startDateField: newStartDateField,
				};
			},
		});

		const endDateField = computed({
			get() {
				return _layoutOptions.value?.endDateField;
			},
			set(newEndDateField: string | null) {
				_layoutOptions.value = {
					...(_layoutOptions.value || {}),
					endDateField: newEndDateField,
				};
			},
		});

		const { items, loading, error, totalPages, itemCount, totalCount, changeManualSort, getItems } = useItems(
			collection,
			{
				sort: computed(() => primaryKeyField.value.field),
				page: ref(1),
				limit: ref(-1),
				fields: computed(() => {
					const fields = [primaryKeyField.value.field, ...getFieldsFromTemplate(template.value)];
					if (startDateField.value) fields.push(startDateField.value);
					if (endDateField.value) fields.push(endDateField.value);
					return fields;
				}),
				filters: filtersWithCalendarView,
				searchQuery: _searchQuery,
			},
			false
		);

		const events = computed(
			() => items.value?.map((item: Item) => parseEvent(item)).filter((e: EventInput | null) => e) || []
		);

		onMounted(() => {
			calendar.value = new Calendar(calendarEl.value!, {
				plugins: [dayGridPlugin, timeGridPlugin],
				initialView: 'dayGridMonth',
				headerToolbar: {
					left: 'prevYear,prev,next,nextYear today',
					center: 'title',
					right: 'dayGridMonth,timeGridWeek,dayGridDay',
				},
				eventClick(info) {
					const primaryKey = info.event.id;
					const endpoint = collection.value.startsWith('directus')
						? collection.value.substring(9)
						: `/collections/${collection.value}`;
					router.push(`${endpoint}/${primaryKey}`);
				},
				events: events.value,
			});

			calendar.value.render();
		});

		// Make sure to re-render the size of the calendar when the available space changes due to the
		// sidebar being manipulated
		watch(
			() => appStore.state.sidebarOpen,
			() => setTimeout(() => calendar.value?.updateSize(), 300)
		);

		watch(items, () => {
			if (calendar.value) {
				calendar.value.pauseRendering();
				calendar.value.setOption('events', events.value);
				calendar.value.resumeRendering();
			}
		});

		onUnmounted(() => {
			calendar.value?.destroy();
		});

		const showingCount = computed(() => {
			return i18n.tc('item_count', itemCount.value);
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
			_filters,
			showingCount,
		};

		function parseEvent(item: Item) {
			if (!startDateField.value) return null;

			return {
				id: item[primaryKeyField.value.field],
				title: renderPlainStringTemplate(template.value || `{{ ${primaryKeyField.value.field} }}`, item),
				start: item[startDateField.value],
				end: endDateField.value ? item[endDateField.value] : null,
			};
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

.calendar-layout {
	padding: var(--content-padding);
	padding-top: 0;
}

.item-count {
	position: relative;
	display: none;
	margin: 0 8px;
	color: var(--foreground-subdued);
	white-space: nowrap;

	@include breakpoint(small) {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
