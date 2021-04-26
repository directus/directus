<template>
	<div>
		<div class="form">
			<div class="field half-left" v-if="fieldData.meta">
				<div class="label type-label">{{ $t('readonly') }}</div>
				<v-checkbox v-model="fieldData.meta.readonly" :label="$t('disabled_editing_value')" block />
			</div>

			<div class="field half-right" v-if="fieldData.meta">
				<div class="label type-label">{{ $t('hidden') }}</div>
				<v-checkbox v-model="fieldData.meta.hidden" :label="$t('hidden_on_detail')" block />
			</div>

			<div class="field full">
				<div class="label type-label">{{ $t('note') }}</div>
				<v-input v-model="fieldData.meta.note" :placeholder="$t('add_note')" />
			</div>

			<div class="field full">
				<div class="label type-label">{{ $t('field_name_translations') }}</div>
				<interface-repeater
					v-model="fieldData.meta.translations"
					:template="'[{{ language }}] {{ translation }}'"
					:fields="[
						{
							field: 'language',
							type: 'string',
							name: $t('language'),
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
							name: $t('translation'),
							meta: {
								interface: 'text-input',
								width: 'half',
								options: {
									placeholder: 'Enter a translation...',
								},
							},
						},
					]"
				/>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
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
	setup(props, { emit }) {
		return {
			fieldData: state.fieldData,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/breakpoint';
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
