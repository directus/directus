<script lang="ts" setup>
import TransitionDialog from '@/components/transition/dialog.vue';
import VOverlay from '@/components/v-overlay.vue';

const collapsed = defineModel<boolean>('collapsed');

defineProps<{ placement: 'left' | 'right' }>();
</script>

<template>
	<Teleport to="#dialog-outlet">
		<TransitionDialog>
			<div v-show="!collapsed" class="container" :class="placement">
				<VOverlay active absolute @click="collapsed = true" />
				<div class="panel">
					<slot />
				</div>
			</div>
		</TransitionDialog>
	</Teleport>
</template>

<style scoped>
.container {
	position: fixed;
	inset: 0;
	z-index: 500;
	display: flex;
	--v-overlay-z-index: 1;
}

.container.right {
	justify-content: flex-end;
}

.panel {
	display: flex;
	block-size: 100%;
	inline-size: 280px;
	max-inline-size: 100%;
	overflow: hidden;
	z-index: 2;
	box-shadow: 0 4px 12px rgb(38 50 56 / 0.1);
}
</style>
