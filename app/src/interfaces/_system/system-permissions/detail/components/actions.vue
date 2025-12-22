<script setup lang="ts">
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { Permission, PrimaryKey } from '@directus/types';

defineProps<{
	permission: Permission;
	policyKey: PrimaryKey | null;
}>();

const emit = defineEmits<{
	save: [];
}>();
</script>

<template>
	<div class="actions">
		<PrivateViewHeaderBarActionButton v-tooltip.bottom="$t('save')" icon="check" @click="emit('save')" />
	</div>
</template>

<style lang="scss" scoped>
.actions {
	display: contents;
}

.v-button:not(:last-child) {
	margin-inline-end: 8px;
}
</style>
