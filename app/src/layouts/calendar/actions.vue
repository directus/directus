<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
	showingCount?: string;
}>();
</script>

<template>
	<transition name="fade">
		<span v-if="showingCount" class="item-count">
			{{ showingCount }}
		</span>
	</transition>
</template>

<style lang="scss" scoped>
.item-count {
	position: relative;
	display: none;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;

	@media (width > 640px) {
		display: inline;
	}
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
