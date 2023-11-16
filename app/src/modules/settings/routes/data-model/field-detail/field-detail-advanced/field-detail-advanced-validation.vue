<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const fieldDetailStore = useFieldDetailStore();

const { loading, collection, field } = storeToRefs(fieldDetailStore);

const { t } = useI18n();

const validation = syncFieldDetailStoreProperty('field.meta.validation');
const validationMessage = syncFieldDetailStoreProperty('field.meta.validation_message');

const validationSync = computed({
	get() {
		return {
			...(validation.value && { validation: validation.value }),
			...(validationMessage.value && { validationMessage: validationMessage.value }),
		};
	},
	set(value) {
		validation.value = value.validation ?? null;
		validationMessage.value = value.validationMessage ?? null;
	},
});

const fields = computed(() => [
	{
		field: 'validation',
		name: t('validation'),
		type: 'json',
		meta: {
			interface: 'system-filter',
			options: {
				collectionName: collection.value,
				fieldName: field.value.field,
				includeFunctions: true,
				includeValidation: true,
			},
		},
	},
	{
		field: 'validationMessage',
		name: t('custom_validation_message'),
		type: 'string',
		meta: {
			interface: 'system-input-translated-string',
		},
	},
]);
</script>

<template>
	<v-notice v-if="!field.field">{{ t('configure_field_key_to_continue') }}</v-notice>

	<v-form v-else v-model="validationSync" :fields="fields" :loading="loading" />
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form {
	--form-vertical-gap: 32px;
	--form-horizontal-gap: 32px;
	@include form-grid;
}

.monospace {
	--v-input-font-family: var(--theme--font-family-monospace);
	--v-select-font-family: var(--theme--font-family-monospace);
}

.required {
	--v-icon-color: var(--theme--primary);
}

.v-notice {
	margin-bottom: 36px;
}
</style>
