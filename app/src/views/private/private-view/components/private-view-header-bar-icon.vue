<script lang="ts" setup>
import PrivateViewHeaderBarActionButton from './private-view-header-bar-action-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	icon?: string;
	iconColor?: string;
	backTo?: string;
}>();
</script>

<template>
	<PrivateViewHeaderBarActionButton
		v-if="backTo !== undefined"
		class="back-button"
		variant="ghost"
		icon="arrow_back"
		:to="backTo"
	/>

	<VIcon v-else-if="icon" :name="icon" :color="iconColor" class="icon-only" />
</template>

<style scoped>
.back-button,
.icon-only {
	flex-shrink: 0;
}

.icon-only {
	--v-icon-color: var(--theme--primary);
}
</style>
