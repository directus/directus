<script setup lang="ts">
import type { ShowSelect } from '@directus/types';
import { useResizeObserver } from '@vueuse/core';
import { debounce } from 'lodash';
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import VNotice from '@/components/v-notice.vue';

import '@fullcalendar/core';

defineOptions({
	inheritAttrs: false,
});

interface Props {
	createCalendar: (calendarElement: HTMLElement) => void;
	destroyCalendar: () => void;
	itemCount?: number | null;
	totalCount: number | null;
	isFiltered: boolean;
	limit: number;
	resetPresetAndRefresh: () => Promise<void>;
	error?: any;
	selectMode: boolean;
	showSelect?: ShowSelect;
	resize: () => void;
}

const props = withDefaults(defineProps<Props>(), {
	itemCount: undefined,
	showSelect: 'none',
});

defineEmits(['update:selection']);

const { n } = useI18n();

const calendarElement = useTemplateRef('calendar-element');

onMounted(() => {
	props.createCalendar(calendarElement.value!);
});

onUnmounted(() => {
	props.destroyCalendar();
});

useResizeObserver(
	calendarElement,
	debounce(() => props.resize(), 50),
);

const atLimit = computed(() => {
	const count = (props.isFiltered ? props.itemCount : props.totalCount) ?? 0;
	return count > props.limit;
});
</script>

<template>
	<div class="calendar-layout" :class="{ 'select-mode': selectMode, 'select-one': showSelect === 'one' }">
		<VNotice v-if="atLimit" type="warning">
			{{ $t('dataset_too_large_currently_showing_n_items', { n: n(props.limit) }) }}
		</VNotice>
		<div v-if="!error" ref="calendar-element" />
		<slot v-else name="error" :error="error" :reset="resetPresetAndRefresh" />
	</div>
</template>

<style lang="scss" scoped>
.calendar-layout {
	block-size: 100%;
	padding: var(--content-padding);
	padding-block-start: 0;
}

.v-notice {
	margin-block-end: 24px;
}
</style>
