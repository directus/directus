<template>
	<transition name="fade">
		<span class="item-count" v-if="itemCount">
			{{ showingCount }}
		</span>
	</transition>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@directus/shared/composables';

export default defineComponent({
	setup() {
		const layoutState = useLayoutState();
		const { itemCount, showingCount } = toRefs(layoutState.value);

		return { itemCount, showingCount };
	},
});
</script>

<style lang="scss" scoped>
.item-count {
	position: relative;
	display: none;
	margin: 0 8px;
	color: var(--foreground-subdued);
	white-space: nowrap;

	@media (min-width: 600px) {
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
