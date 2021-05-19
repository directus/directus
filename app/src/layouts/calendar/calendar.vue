<template>
	<div class="calendar-layout">
		<div ref="calendarEl" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import '@fullcalendar/core/vdom';
import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { calendarEl } = toRefs(layoutState.value);

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
