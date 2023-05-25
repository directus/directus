<template>
	<interface-list
		:value="repeaterValue"
		template="{{ name }} - {{ meta.interface }}"
		:fields="repeaterFields"
		@input="repeaterValue = $event"
	/>
</template>

<script setup lang="ts">
import { FIELD_TYPES_SELECT } from '@/constants';
import { translate } from '@/utils/translate-object-values';
import formatTitle from '@directus/format-title';
import { Field } from '@directus/types';
import { set } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
	value: Field[];
}

const props = defineProps<Props>();

const emit = defineEmits(['input']);

const repeaterValue = computed({
	get() {
		return (
			props.value?.map((fieldObj) => {
				const { field, type, name, meta, schema } = fieldObj;

				const fieldName = !name && field ? formatTitle(field) : name;

				const flattenedField: Record<string, any> = { field, type, name: fieldName };

				for (const [k, v] of Object.entries(meta ?? {})) {
					flattenedField[`meta.${k}`] = v;
				}

				for (const [k, v] of Object.entries(schema ?? {})) {
					flattenedField[`schema.${k}`] = v;
				}

				return flattenedField;
			}) ?? null
		);
	},
	set(newVal: Record<string, any>[] | null) {
		emit(
			'input',
			newVal?.map((field) => {
				const expandedField = {};

				for (const [k, v] of Object.entries(field)) {
					set(expandedField, k.split('.'), v);
				}

				return expandedField;
			})
		);
	},
});

const repeaterFields = computed(() => {
	return [
		{
			name: t('field_key'),
			field: 'field',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'half',
				required: true,
				options: {
					dbSafe: true,
					font: 'monospace',
					placeholder: t('field_key_placeholder'),
				},
			},
		},
		{
			name: t('field_name'),
			field: 'name',
			type: 'string',
			meta: {
				interface: 'system-input-translated-string',
				width: 'half',
				options: {
					placeholder: t('field_name_placeholder'),
				},
			},
		},
		{
			name: t('type'),
			field: 'type',
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: translate(FIELD_TYPES_SELECT),
				},
			},
		},
		{
			name: t('interface_label'),
			field: 'meta.interface',
			type: 'string',
			meta: {
				interface: 'system-interface',
				width: 'half',
				options: {
					typeField: 'type',
				},
			},
		},
		{
			name: t('note'),
			field: 'meta.note',
			type: 'string',
			meta: {
				interface: 'system-input-translated-string',
				width: 'full',
				options: {
					placeholder: t('interfaces.list.field_note_placeholder'),
				},
			},
		},
		{
			name: t('field_width'),
			field: 'meta.width',
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				options: {
					choices: [
						{
							value: 'half',
							text: t('half_width'),
						},
						{
							value: 'full',
							text: t('full_width'),
						},
					],
				},
			},
		},
		{
			name: t('required'),
			field: 'meta.required',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				options: {
					label: t('requires_value'),
				},
				width: 'half',
			},
		},
		{
			name: t('options'),
			field: 'meta.options',
			type: 'string',
			meta: {
				interface: 'system-interface-options',
				width: 'full',
				options: {
					interfaceField: 'meta.interface',
				},
			},
		},
	];
});
</script>
