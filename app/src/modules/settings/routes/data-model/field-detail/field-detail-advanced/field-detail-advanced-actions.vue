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

<script lang="ts">
import { defineComponent } from 'vue';
import { useFieldDetailStore } from '../store';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	emits: ['save'],
	setup() {
		const fieldDetailStore = useFieldDetailStore();
		const { saving, readyToSave } = storeToRefs(fieldDetailStore);

		const { t } = useI18n();

		return { saving, t, readyToSave };
	},
});
</script>
