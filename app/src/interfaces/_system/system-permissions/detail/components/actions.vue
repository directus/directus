<script setup lang="ts">
import { Permission, PrimaryKey } from '@directus/types';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

defineProps<{
	permission: Permission;
	policyKey: PrimaryKey | null;
}>();

const emit = defineEmits<{
	save: [];
}>();
</script>

<template>
	<PrivateViewHeaderBarActionButton :label="$t('save')" icon="check" @click="emit('save')" />
</template>
