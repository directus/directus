<script lang="ts" setup>
import VOverlay from '@/components/v-overlay.vue';

const collapsed = defineModel<boolean>('collapsed');

defineProps<{ placement: 'left' | 'right' }>();
</script>

<template>
	<Teleport to="#dialog-outlet">
		<VOverlay :active="!collapsed" @click="collapsed = true" />
		<div class="panel" :class="[placement, { open: !collapsed }]">
			<slot />
		</div>
	</Teleport>
</template>

<style scoped>
.v-overlay {
	--v-overlay-z-index: 490;
}

.panel {
	position: fixed;
	inset-block: 0;
	z-index: 491;
	inline-size: 280px;
	max-inline-size: 100%;
	display: flex;
	block-size: 100%;
	box-shadow: 0 4px 12px rgb(38 50 56 / 0.1);
	opacity: 0;
	visibility: hidden;
	pointer-events: none;
	transition-property: transform, opacity, visibility;
	transition-duration: var(--medium);
	transition-timing-function: var(--transition-out), var(--transition), step-end;
}

.panel.right {
	inset-inline-end: 0;
	transform: translateX(50px);
}

.panel.left {
	inset-inline-start: 0;
	transform: translateX(-50px);
}

.panel.open {
	opacity: 1;
	visibility: visible;
	pointer-events: auto;
	transform: translateX(0);
	transition-timing-function: var(--transition-in), var(--transition), step-start;
}
</style>
