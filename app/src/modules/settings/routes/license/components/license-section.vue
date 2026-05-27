<script setup lang="ts">
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';

const { kind = 'neutral' } = defineProps<{
	icon: string;
	title: string;
	kind?: 'neutral' | 'danger';
}>();
</script>

<template>
	<InterfacePresentationDivider :title :icon class="section-header" :class="[kind]" />

	<slot />
</template>

<style lang="scss" scoped>
.section-header {
	margin-block-end: 1.5rem;

	&.danger {
		--v-icon-color: var(--theme--danger);
	}
}
</style>
