<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import '@fullcalendar/core';

const { n, t } = useI18n();

interface Props {
	createCalendar: (calendarElement: HTMLElement) => void;
	destroyCalendar: () => void;
	itemCount?: number;
	resetPresetAndRefresh: () => Promise<void>;
	error?: any;
}

const props = withDefaults(defineProps<Props>(), {
	itemCount: undefined,
});

defineEmits(['update:selection']);

const calendarElement = ref<HTMLElement>();

onMounted(() => {
	props.createCalendar(calendarElement.value!);
});

onUnmounted(() => {
	props.destroyCalendar();
});

const atLimit = computed(() => props.itemCount === 10000);
</script>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
	inheritAttrs: false,
});
</script>

<template>
	<div class="calendar-layout">
		<v-notice v-if="atLimit" type="warning">
			{{ t('dataset_too_large_currently_showing_n_items', { n: n(10000) }) }}
		</v-notice>
		<div v-if="!error" ref="calendarElement" />
		<slot v-else name="error" :error="error" :reset="resetPresetAndRefresh" />
	</div>
</template>

<style lang="scss" scoped>
.calendar-layout {
	height: calc(100% - calc(var(--header-bar-height) + 2 * 24px));
	padding: var(--content-padding);
	padding-top: 0;
}

.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-dot-event .fc-event-time) {
	font-weight: 700;
}

.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-dot-event .fc-event-title) {
	font-weight: inherit;
}

.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-dot-event) {
	color: var(--theme--primary);
	padding: 1px 4px;
}

.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-dot-event:hover) {
	background-color: transparent;
}

.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-dot-event:not(:has(.fc-event-time))) {
	background-color: var(--theme--primary);
	color: var(--fc-event-text-color);
}

.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-block-event) {
	padding: 0px 4px;
	line-height: 1.5;
}

.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-block-event .fc-event-time),
.calendar-layout :deep(.fc-daygrid-event.fc-daygrid-block-event .fc-event-title) {
	padding: 0;
}

.v-notice {
	margin-bottom: 24px;
}
</style>
