<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore } from '../store';

defineEmits(['save']);

const fieldDetailStore = useFieldDetailStore();
const { saving, readyToSave } = storeToRefs(fieldDetailStore);

const { t } = useI18n();
</script>

<template>
	<v-button
		v-tooltip.bottom="t('save')"
		:disabled="readyToSave === false"
		:loading="saving"
		icon
		rounded
		@click="$emit('save')"
	>
		<v-icon name="check" />
	</v-button>
</template>
