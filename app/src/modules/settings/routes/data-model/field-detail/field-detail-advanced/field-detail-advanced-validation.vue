<template>
	<div class="form">
		<div class="field full">
			<div class="label type-label">{{ t('validation') }}</div>
			<interface-system-filter
				:collection-name="collection"
				:value="validation"
				:field="field.field"
				@input="validation = $event"
			/>
		</div>

		<div class="field full">
			<div class="label type-label">{{ t('custom_validation_message') }}</div>
			<interface-system-input-translated-string :value="validationMessage" @input="validationMessage = $event" />
		</div>
	</div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const fieldDetailStore = useFieldDetailStore();

const { collection, field } = storeToRefs(fieldDetailStore);

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
