<script setup lang="ts">
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { DeepPartial, Field } from '@directus/types';
import { isEqual } from 'lodash';
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
			validation: validation.value,
			validationMessage: validationMessage.value,
		};
	},
	set(value) {
		if (!isEqual(value.validation, validation.value)) validation.value = value.validation;
		if (!isEqual(value.validationMessage, validationMessage.value)) validationMessage.value = value.validationMessage;
	},
});

const validationInitial = validationSync.value;

const fields = computed<DeepPartial<Field>[]>(() => [
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
	<v-notice v-if="!field.field">{{ $t('configure_field_key_to_continue') }}</v-notice>

	<v-form v-else v-model="validationSync" :initial-values="validationInitial" :fields="fields" :loading="loading" />
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.form {
	--theme--form--row-gap: 32px;
	--theme--form--column-gap: 32px;
	@include mixins.form-grid;
}

.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
	--v-select-font-family: var(--theme--fonts--monospace--font-family);
}

.required {
	--v-icon-color: var(--theme--primary);
}

.v-notice {
	margin-block-end: 36px;
}
</style>
