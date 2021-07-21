<template>
	<div class="calendar-layout">
		<div ref="calendarEl" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, onMounted, onUnmounted, toRefs } from 'vue';

import '@fullcalendar/core/vdom';
import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { calendarEl, createCalendar, destroyCalendar } = toRefs(layoutState.value);

		onMounted(() => {
			const create = createCalendar.value;
			create();
		});
		onUnmounted(() => {
			const destroy = destroyCalendar.value;
			destroy();
		});

		return { t, calendarEl };
	},
});
</script>

<style lang="scss" scoped>
.calendar-layout {
	padding: var(--content-padding);
	padding-top: 0;
}
</style>
