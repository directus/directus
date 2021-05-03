<template>
	<div class="calendar-layout">
		<div ref="calendarEl" />
	</div>
</template>

<script lang="ts">
import '@fullcalendar/core/vdom';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { defineComponent, onMounted, onUnmounted, ref, watchEffect, watch } from '@vue/composition-api';
import { useAppStore } from '@/stores/app';

export default defineComponent({
	setup() {
		const appStore = useAppStore();

		const calendarEl = ref<HTMLElement>();
		const calendar = ref<Calendar>();

		calendar.value?.updateSize();

		onMounted(() => {
			calendar.value = new Calendar(calendarEl.value!, {
				plugins: [dayGridPlugin],
				initialView: 'dayGridMonth',
				headerToolbar: {
					start: '',
					center: '',
					end: '',
				},
			});

			calendar.value.render();
		});

		watch(appStore.state.sidebarOpen, () => calendar.value?.updateSize());

		// To change options on the fly:
		// watchEffect(() => {
		// 	if (calendar.value) {
		// 		calendar.value.pauseRendering();
		// 		calendar.value.resetOptions({});
		// 		calendar.value.resumeRendering();
		// 	}
		// });

		onUnmounted(() => {
			calendar.value?.destroy();
		});

		return { calendarEl };
	},
});
</script>

<style lang="scss" scoped>
.calendar-layout {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
