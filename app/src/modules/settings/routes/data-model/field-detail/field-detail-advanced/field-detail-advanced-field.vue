<template>
	<div class="form">
		<div v-if="!isGenerated" class="field half-left">
			<div class="label type-label">{{ t('readonly') }}</div>
			<v-checkbox v-model="readonly" :label="t('disabled_editing_value')" block />
		</div>

		<div v-if="!isGenerated" class="field half-right">
			<div class="label type-label">{{ t('required') }}</div>
			<v-checkbox v-model="required" :label="t('require_value_to_be_set')" block />
		</div>

		<div class="field half-left">
			<div class="label type-label">{{ t('hidden') }}</div>
			<v-checkbox v-model="hidden" :label="t('hidden_on_detail')" block />
		</div>

		<div v-if="type !== 'group'" class="field full">
			<div class="label type-label">{{ t('note') }}</div>
			<v-skeleton-loader v-if="loading" />
			<interface-system-input-translated-string
				v-else
				:value="note"
				:placeholder="t('add_note')"
				@input="note = $event"
			/>
		</div>

		<div class="field full">
			<div class="label type-label">{{ t('field_name_translations') }}</div>

			<interface-list
				:template="'[{{ language }}] {{ translation }}'"
				:fields="[
					{
						field: 'language',
						type: 'string',
						name: t('language'),
						meta: {
							interface: 'system-language',
							width: 'full',
							required: true,
							display: 'formatted-value',
							display_options: {
								font: 'monospace',
								color: 'var(--foreground-subdued)',
							},
						},
						schema: {
							default_value: 'en-US',
						},
					},
					{
						field: 'translation',
						type: 'string',
						name: t('translation'),
						meta: {
							interface: 'input-multiline',
							width: 'full',
							required: true,
							options: {
								placeholder: t('translation_placeholder'),
							},
						},
					},
				]"
				:value="translations"
				@input="translations = $event"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const { t } = useI18n();
const fieldDetailStore = useFieldDetailStore();
const readonly = syncFieldDetailStoreProperty('field.meta.readonly', false);
const hidden = syncFieldDetailStoreProperty('field.meta.hidden', false);
const required = syncFieldDetailStoreProperty('field.meta.required', false);
const note = syncFieldDetailStoreProperty('field.meta.note');
const translations = syncFieldDetailStoreProperty('field.meta.translations');
const { loading, field } = storeToRefs(fieldDetailStore);
const type = computed(() => field.value.type);
const isGenerated = computed(() => field.value.schema?.is_generated);
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.type-title {
	margin-bottom: 32px;
}

.form {
	--form-vertical-gap: 32px;
	--form-horizontal-gap: 32px;

	@include form-grid;
}

.monospace {
	--v-input-font-family: var(--family-monospace);
}

.required {
	--v-icon-color: var(--primary);
}

.v-notice {
	margin-bottom: 36px;
}
</style>
