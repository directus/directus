<script lang="ts" setup>
import VDialog from '@/components/v-dialog.vue';

const collapsed = defineModel<boolean>('collapsed');

defineProps<{ placement: 'left' | 'right' }>();
</script>

<template>
	<VDialog :model-value="!collapsed" :placement @update:model-value="collapsed = !$event">
		<div>
			<slot />
		</div>
	</VDialog>
</template>

<style scoped>
div {
	display: flex;
	block-size: 100%;
	inline-size: 100%;
}
</style>
