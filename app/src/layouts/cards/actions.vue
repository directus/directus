<template>
	<transition name="fade">
		<span class="item-count" v-if="layoutState.itemCount">{{ layoutState.showingCount }}</span>
	</transition>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';

import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();

		return { t, layoutState };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';

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

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
