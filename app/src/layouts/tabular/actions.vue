<template>
	<transition name="fade">
		<span class="item-count" v-if="itemCount">
			{{ showingCount }}
		</span>
	</transition>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, toRefs } from 'vue';

import { useLayoutState } from '@/composables/use-layout';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const layoutState = useLayoutState();
		const { itemCount, showingCount } = toRefs(layoutState.value);

		return { t, itemCount, showingCount };
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
