<template>
	<div class="form">
		<div class="field full">
			<div class="label type-label">{{ t('validation') }}</div>
			<interface-system-filter
				:collection-name="collection"
				:value="validation"
				:field-name="field.field"
				include-functions
				include-validation
				@input="validation = $event"
			/>
		</div>

		<div class="field full">
			<div class="label type-label">{{ t('custom_validation_message') }}</div>
			<v-skeleton-loader v-if="loading" />
			<interface-system-input-translated-string v-else :value="validationMessage" @input="validationMessage = $event" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const fieldDetailStore = useFieldDetailStore();

const { loading, collection, field } = storeToRefs(fieldDetailStore);

const { t } = useI18n();

const validation = syncFieldDetailStoreProperty('field.meta.validation');
const validationMessage = syncFieldDetailStoreProperty('field.meta.validation_message');
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form {
	--form-vertical-gap: 32px;
	--form-horizontal-gap: 32px;
	@include form-grid;
}

.monospace {
	--v-input-font-family: var(--family-monospace);
	--v-select-font-family: var(--family-monospace);
}

.required {
	--v-icon-color: var(--primary);
}

.v-notice {
	margin-bottom: 36px;
}
</style>
