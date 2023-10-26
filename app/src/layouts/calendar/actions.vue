<script lang="ts">
export default {
	inheritAttrs: false,
};
</script>

<script setup lang="ts">
defineProps<{
	itemCount?: number;
	showingCount?: string;
}>();
</script>

<template>
	<transition name="fade">
		<span v-if="itemCount" class="item-count">
			{{ showingCount }}
		</span>
	</transition>
</template>

<style lang="scss" scoped>
.item-count {
	position: relative;
	display: none;
	margin: 0 8px;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;

	@media (min-width: 600px) {
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
