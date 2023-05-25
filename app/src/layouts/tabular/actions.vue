<template>
	<transition name="fade">
		<span v-if="itemCount" class="item-count">
			{{ showingCount }}
		</span>
	</transition>
</template>

<script setup lang="ts">
defineProps<{
	itemCount?: number;
	showingCount: string;
}>();
</script>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
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
