<template>
	<div>
		<div class="form">
			<div v-if="fieldData.meta" class="field half-left">
				<div class="label type-label">{{ t('readonly') }}</div>
				<v-checkbox v-model="fieldData.meta.readonly" :label="t('disabled_editing_value')" block />
			</div>

			<div v-if="fieldData.meta" class="field half-right">
				<div class="label type-label">{{ t('hidden') }}</div>
				<v-checkbox v-model="fieldData.meta.hidden" :label="t('hidden_on_detail')" block />
			</div>

			<div v-if="fieldData.meta" class="field half-left">
				<div class="label type-label">{{ t('required') }}</div>
				<v-checkbox v-model="fieldData.meta.required" :label="t('require_value_to_be_set')" block />
			</div>

			<div v-if="type !== 'group'" class="field full">
				<div class="label type-label">{{ t('note') }}</div>
				<v-input v-model="fieldData.meta.note" :placeholder="t('add_note')" />
			</div>

			<div class="field full">
				<div class="label type-label">{{ t('field_name_translations') }}</div>
				<interface-list
					:value="fieldData.meta.translations"
					:template="'[{{ language }}] {{ translation }}'"
					:fields="[
						{
							field: 'language',
							type: 'string',
							name: t('language'),
							meta: {
								interface: 'system-language',
								width: 'half',
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
								interface: 'input',
								width: 'half',
								options: {
									placeholder: t('translation_placeholder'),
								},
							},
						},
					]"
					@input="fieldData.meta.translations = $event"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent } from 'vue';
import { state } from '../store';

export default defineComponent({
	props: {
		isExisting: {
			type: Boolean,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	setup() {
		const { t } = useI18n();

		return { t, fieldData: state.fieldData };
	},
});
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
