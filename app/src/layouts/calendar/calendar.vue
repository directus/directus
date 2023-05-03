<template>
	<div class="calendar-layout">
		<v-notice v-if="atLimit" type="warning">
			{{ t('dataset_too_large_currently_showing_n_items', { n: n(10000) }) }}
		</v-notice>
		<div ref="calendarElement" />
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import '@fullcalendar/core';

const { n, t } = useI18n();

interface Props {
	createCalendar: (calendarElement: HTMLElement) => void;
	destroyCalendar: () => void;
	itemCount?: number;
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
