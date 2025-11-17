<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ShowSelect } from '@directus/types';

import '@fullcalendar/core';

defineOptions({
	inheritAttrs: false,
});

interface Props {
	createCalendar: (calendarElement: HTMLElement) => void;
	destroyCalendar: () => void;
	itemCount: number | null;
	totalCount: number | null;
	isFiltered: boolean;
	limit: number;
	resetPresetAndRefresh: () => Promise<void>;
	error?: any;
	selectMode: boolean;
	showSelect: ShowSelect;
}

const props = withDefaults(defineProps<Props>(), {
	itemCount: undefined,
	showSelect: 'none',
});

defineEmits(['update:selection']);

const { n } = useI18n();

const calendarElement = ref<HTMLElement>();

onMounted(() => {
	props.createCalendar(calendarElement.value!);
});

onUnmounted(() => {
	props.destroyCalendar();
});

const atLimit = computed(() => {
	const count = (props.isFiltered ? props.itemCount : props.totalCount) ?? 0;
	return count > props.limit;
});
</script>

<template>
	<div class="calendar-layout" :class="{ 'select-mode': selectMode, 'select-one': showSelect === 'one' }">
		<v-notice v-if="atLimit" type="warning">
			{{ $t('dataset_too_large_currently_showing_n_items', { n: n(props.limit) }) }}
		</v-notice>
		<div v-if="!error" ref="calendarElement" />
		<slot v-else name="error" :error="error" :reset="resetPresetAndRefresh" />
	</div>
</template>

<style lang="scss" scoped>
.calendar-layout {
	block-size: calc(100% - calc(var(--header-bar-height) + 2 * 24px));
	padding: var(--content-padding);
	padding-block-start: 0;
}

.v-notice {
	margin-block-end: 24px;
}
</style>
