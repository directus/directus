<script lang="ts" setup>
import VDialog from '@/components/v-dialog.vue';

const collapsed = defineModel<boolean>('collapsed');

defineProps<{ placement: 'left' | 'right'; keepMounted?: boolean }>();
</script>

<template>
	<VDialog :model-value="!collapsed" :placement :keep-mounted @update:model-value="collapsed = !$event">
		<div class="panel">
			<slot />
		</div>
	</VDialog>
</template>

<style scoped>
.panel {
	position: relative;
	display: flex;
	block-size: 100%;
	inline-size: 280px;
	max-inline-size: 100%;
}
</style>
