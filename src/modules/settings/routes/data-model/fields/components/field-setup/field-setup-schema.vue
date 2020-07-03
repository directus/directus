<template>
	<div>
		<h2 class="type-title" v-if="isNew">{{ $t('schema_options_title') }}</h2>

		<v-form :edits="value" @input="$emit('input', $event)" :fields="fields" primary-key="+" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import i18n from '@/lang';
import { FormField } from '@/components/v-form/types';
import { Field, types } from '@/stores/fields/types';
import interfaces from '@/interfaces';

export default defineComponent({
	props: {
		isNew: {
			type: Boolean,
			default: false,
		},
		value: {
			type: Object as PropType<Field>,
			required: true,
		},
	},
	setup(props) {
		const selectedInterface = computed(() => interfaces.find((inter) => inter.id === props.value.system.interface));

		const typeChoices = computed(() => {
			let availableTypes = types;

			if (selectedInterface.value) {
				availableTypes = selectedInterface.value.types;
			}

			return availableTypes.map((type) => ({
				text: i18n.t(type),
				value: type,
			}));
		});

		const fields = computed(() => {
			const fields: FormField[] = [
				{
					field: 'field',
					name: i18n.t('database_column_name'),
					system: {
						interface: 'slug',
						width: 'half',
						options: null,
						readonly: props.isNew === false,
					},
				},
				{
					field: 'note',
					name: i18n.t('note'),
					system: {
						interface: 'text-input',
						width: 'full',
						options: {
							placeholder: i18n.t('add_helpful_note'),
						},
					},
				},
				{
					field: 'translation',
					name: i18n.t('translations'),
					system: {
						interface: 'key-value',
						width: 'full',
						options: null,
					},
				},
				{
					field: 'default_value',
					name: i18n.t('default_value'),
					system: {
						interface: 'text-input' /** @TODO base on selected datatype */,
						width: 'half',
						options: {
							placeholder: i18n.t('enter_value'),
						},
					},
				},
				{
					field: 'length',
					name: i18n.t('length'),
					system: {
						interface: 'numeric',
						width: 'half',
						options: null,
					},
				},
				{
					field: 'required',
					name: i18n.t('required'),
					system: {
						interface: 'toggle',
						width: 'half',
						options: null,
					},
				},
				{
					field: 'readonly',
					name: i18n.t('readonly'),
					system: {
						interface: 'toggle',
						width: 'half',
						options: null,
					},
				},
				{
					field: 'hidden_detail',
					name: i18n.t('hide_on_detail'),
					system: {
						interface: 'toggle',
						width: 'half',
						options: null,
					},
				},
				{
					field: 'hidden_browse',
					name: i18n.t('hide_on_browse'),
					system: {
						interface: 'toggle',
						width: 'half',
						options: null,
					},
				},
				{
					field: 'unique',
					name: i18n.t('unique'),
					system: {
						interface: 'toggle',
						width: 'half',
						options: null,
					},
				},
				{
					field: 'primary_key',
					name: i18n.t('primary_key'),
					system: {
						interface: 'toggle',
						width: 'half',
						options: null,
					},
				},
				{
					field: 'validation',
					name: i18n.t('validation_regex'),
					system: {
						interface: 'text-input',
						width: 'half',
						options: {
							font: 'monospace',
							placeholder: 'eg: /^[A-Z]+$/',
						},
					},
				},
				{
					field: 'validation_message',
					name: i18n.t('validation_message'),
					system: {
						interface: 'text-input',
						width: 'half',
					},
				},
				{
					field: 'type',
					name: i18n.t('directus_type'),
					system: {
						interface: 'dropdown',
						width: 'half',
						options: {
							choices: typeChoices.value,
						},
					},
				},
				{
					field: 'datatype',
					name: i18n.t('database_type'),
					system: {
						interface: 'text-input',
						width: 'half',
					},
				},
			];

			return fields;
		});

		return { fields };
	},
});
</script>
