<script setup lang="ts">
defineOptions({ inheritAttrs: false });

defineProps<{
	showingCount?: string;
}>();
</script>

<template>
	<Transition name="fade">
		<span v-if="showingCount" class="item-count">
			{{ showingCount }}
		</span>
	</Transition>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.item-count {
	position: relative;
	display: none;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;

	@include mixins.breakpoint-up('sm') {
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
