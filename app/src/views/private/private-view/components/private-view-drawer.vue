<script lang="ts" setup>
import VDialog from '@/components/v-dialog.vue';

const collapsed = defineModel<boolean>('collapsed');

const props = defineProps<{ placement: 'left' | 'right'; eager?: boolean }>();
</script>

<template>
	<VDialog :model-value="!collapsed" :placement :eager="props.eager" @update:model-value="collapsed = !$event">
		<div>
			<slot />
		</div>
	</VDialog>
</template>

<style scoped>
div {
	display: flex;
	block-size: 100%;
	inline-size: 280px;
	max-inline-size: 100%;
}
</style>
