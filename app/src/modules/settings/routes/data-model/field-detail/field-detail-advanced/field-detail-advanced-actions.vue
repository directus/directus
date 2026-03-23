<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFieldDetailStore } from '../store';
import { PrivateViewHeaderBarActionButton } from '@/views/private';

defineEmits(['save']);

const fieldDetailStore = useFieldDetailStore();
const { saving, readyToSave } = storeToRefs(fieldDetailStore);
</script>

<template>
	<PrivateViewHeaderBarActionButton
		v-tooltip.bottom="$t('save')"
		:disabled="readyToSave === false"
		:loading="saving"
		icon="check"
		@click="$emit('save')"
	/>
</template>
