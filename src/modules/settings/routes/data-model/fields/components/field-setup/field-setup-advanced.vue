<template>
	<v-tab-item value="advanced">
		<h2 class="title" v-if="isNew">{{ $t('advanced_options_title') }}</h2>

		<v-form :initial-values="existingField" v-model="_edits" :fields="fields" primary-key="+" />
	</v-tab-item>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import { Field } from '@/stores/fields/types';
import { FormField } from '@/components/v-form/types';
import { useSync } from '@/composables/use-sync';
import { i18n } from '@/lang';

export default defineComponent({
	props: {
		existingField: {
			type: Object as PropType<Field>,
			default: null,
		},
		edits: {
			type: Object as PropType<Partial<Field>>,
			default: null,
		},
		isNew: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const fields = computed(() => {
			const fields: FormField[] = [
				{
					field: 'field',
					name: i18n.t('database_column_name'),
					interface: 'slug',
					width: 'half',
					options: null,
					readonly: props.isNew === false,
				},
				{
					field: 'note',
					name: i18n.t('note'),
					interface: 'text-input',
					width: 'full',
					options: {
						placeholder: i18n.t('add_helpful_note'),
					},
				},
				{
					field: 'translation',
					name: i18n.t('translations'),
					interface: 'key-value',
					width: 'full',
					options: null,
				},
				{
					field: 'default',
					name: i18n.t('default_value'),
					interface: 'text-input' /** @TODO base on selected datatype */,
					width: 'half',
					options: {
						placeholder: i18n.t('enter_value'),
					},
				},
				{
					field: 'length',
					name: i18n.t('length'),
					interface: 'numeric',
					width: 'half',
					options: null,
				},
				{
					field: 'required',
					name: i18n.t('required'),
					interface: 'switch',
					width: 'half',
					options: null,
				},
				{
					field: 'readonly',
					name: i18n.t('readonly'),
					interface: 'switch',
					width: 'half',
					options: null,
				},
				{
					field: 'hidden_detail',
					name: i18n.t('hide_on_detail'),
					interface: 'switch',
					width: 'half',
					options: null,
				},
				{
					field: 'hidden_browse',
					name: i18n.t('hide_on_browse'),
					interface: 'switch',
					width: 'half',
					options: null,
				},
				{
					field: 'unique',
					name: i18n.t('unique'),
					interface: 'switch',
					width: 'half',
					options: null,
				},
				{
					field: 'primary_key',
					name: i18n.t('primary_key'),
					interface: 'switch',
					width: 'half',
					options: null,
				},
				{
					field: 'validation',
					name: i18n.t('validation_regex'),
					interface: 'text-input',
					width: 'half',
					options: {
						font: 'monospace',
						placeholder: 'eg: /^[A-Z]+$/',
					},
				},
				{
					field: 'validation_message',
					name: i18n.t('validation_message'),
					interface: 'text-input',
					width: 'half',
				},
				{
					field: 'type',
					name: i18n.t('directus_type'),
					interface: 'text-input',
					width: 'half',
				},
				{
					field: 'datatype',
					name: i18n.t('database_type'),
					interface: 'text-input',
					width: 'half',
				},
			];

			return fields;
		});

		const _edits = useSync(props, 'edits', emit);

		return { fields, _edits };
	},
});
</script>
