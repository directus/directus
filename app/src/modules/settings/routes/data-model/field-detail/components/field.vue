<template>
	<div>
		<v-notice type="info">{{ $t('schema_field_title') }}</v-notice>

		<div class="form">
			<div class="field half-left" v-if="fieldData.meta">
				<div class="label type-label">{{ $t('readonly') }}</div>
				<v-checkbox v-model="fieldData.meta.readonly" :label="$t('disabled_editing_value')" block />
			</div>

			<div class="field half-right" v-if="fieldData.meta">
				<div class="label type-label">{{ $t('hidden') }}</div>
				<v-checkbox v-model="fieldData.meta.hidden" :label="$t('hidden_on_detail')" block />
			</div>

			<div class="field full" v-if="['file', 'files'].includes(fieldType)">
				<div class="label type-label">{{ $t('folder') }}</div>
				<folder-picker v-model="_folder" />
				<div class="note" v-html="$t('field_files_new_files_folder')" />
			</div>

			<div class="field full">
				<div class="label type-label">{{ $t('note') }}</div>
				<v-input v-model="fieldData.meta.note" :placeholder="$t('add_note')" />
			</div>

			<div class="field full">
				<div class="label type-label">{{ $t('field_name_translations') }}</div>
				<interface-repeater
					v-model="fieldData.meta.translations"
					:template="'{{ translation }} ({{ language }})'"
					:fields="[
						{
							field: 'language',
							type: 'string',
							name: $t('language'),
							meta: {
								interface: 'system-language',
								width: 'half',
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
import { defineComponent, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync';
import { types } from '@/types';
import i18n from '@/lang';
import FolderPicker from '@/modules/files/components/folder-picker.vue';
import { state } from '../store';

export default defineComponent({
	components: { FolderPicker },
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
		const _folder = computed({
			get() {
				return state.fieldData?.meta?.options?.folder;
			},
			set(folder: string | null) {
				const newFieldData = {
					...state.fieldData,
				};
				if (!newFieldData.meta) {
					newFieldData.meta = {};
				}
				if (!newFieldData.meta.options) {
					newFieldData.meta.options = {};
				}
				newFieldData.meta.options.folder = folder;
				state.fieldData = newFieldData;
			},
		});

		return {
			_folder,
			fieldType: props.type,
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
	--v-form-vertical-gap: 32px;
	--v-form-horizontal-gap: 32px;

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

.note {
	display: block;
	margin-top: 4px;
	color: var(--foreground-subdued);
	font-style: italic;
}
</style>
