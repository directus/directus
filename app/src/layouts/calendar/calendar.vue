<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ShowSelect } from '@directus/extensions';

import '@fullcalendar/core';

defineOptions({
	inheritAttrs: false,
});

interface Props {
	createCalendar: (calendarElement: HTMLElement) => void;
	destroyCalendar: () => void;
	itemCount?: number;
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

const { n, t } = useI18n();

const calendarElement = ref<HTMLElement>();

onMounted(() => {
	props.createCalendar(calendarElement.value!);
});

onUnmounted(() => {
	props.destroyCalendar();
});

const atLimit = computed(() => props.itemCount === 10000);
</script>

<template>
	<div class="calendar-layout" :class="{ 'select-mode': selectMode, 'select-one': showSelect === 'one' }">
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

.v-notice {
	margin-bottom: 24px;
}
</style>
