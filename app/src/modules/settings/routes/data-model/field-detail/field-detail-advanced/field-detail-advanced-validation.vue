<template>
	<div>
		<v-form v-model="validationFormValue" :fields="fields" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const fieldDetailStore = useFieldDetailStore();

		const { field, collection } = storeToRefs(fieldDetailStore);

		const validation = syncFieldDetailStoreProperty('field.meta.validation');

		const fields = computed(() => [
			{
				field: 'validation',
				name: t('rule'),
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: collection.value,
						collectionField: field.value.field,
					},
				},
			},
		]);

		const validationFormValue = computed({
			get() {
				return { validation: validation.value };
			},
			set(formValue: Record<string, any>) {
				validation.value = formValue.validation;
			},
		});

		return { fields, validationFormValue };
	},
});
</script>
