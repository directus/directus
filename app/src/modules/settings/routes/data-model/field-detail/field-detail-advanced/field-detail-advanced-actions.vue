<script setup lang="ts">
import PrivateViewHeaderBarActionButton from '@/views/private/private-view/components/private-view-header-bar-action-button.vue';
import { storeToRefs } from 'pinia';
import { useFieldDetailStore } from '../store';

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
