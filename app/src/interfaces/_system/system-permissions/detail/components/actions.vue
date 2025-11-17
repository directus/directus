<script setup lang="ts">
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
		<v-button v-tooltip.bottom="$t('save')" icon rounded @click="emit('save')">
			<v-icon name="check" />
		</v-button>
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
