import type { DeepPartial, Field } from '@directus/types';
import { omit } from 'lodash-es';
import { OUTPUT_FIELD_MAX_DEPTH } from './output-schema';
import { getAvailableModels, getModelKey, getProviderIcon } from '@/ai/utils/available-models';
import { getPermissionsField } from '@/ai/utils/operation-options';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';

/** The files field hides for models that can't read attachments, so the files are dropped too instead of sent. */
export function applyModelLimits(options: Record<string, unknown>): Record<string, unknown> {
	const model = getModelChoices().find((choice) => choice.value === options['model']);
	return model?.attachment === false ? omit(options, 'files') : options;
}

export function getModelChoices() {
	const providers = useServerStore().info.ai_providers ?? [];

	return getAvailableModels(useSettingsStore().settings, providers).map((model) => ({
		text: model.name,
		value: getModelKey(model),
		icon: getProviderIcon(model.provider),
		attachment: model.attachment,
	}));
}

export const TYPE_CHOICES = [
	{ text: '$t:operations.ai-text.type_text', value: 'string' },
	{ text: '$t:operations.ai-text.type_number', value: 'number' },
	{ text: '$t:operations.ai-text.type_integer', value: 'integer' },
	{ text: '$t:operations.ai-text.type_boolean', value: 'boolean' },
	{ text: '$t:operations.ai-text.type_object', value: 'object' },
	{ text: '$t:operations.ai-text.type_strings', value: 'strings' },
	{ text: '$t:operations.ai-text.type_numbers', value: 'numbers' },
	{ text: '$t:operations.ai-text.type_objects', value: 'objects' },
];

const NESTED_TYPES = ['object', 'objects'];

/** The `fields` list for the field editor: one row per key, with nested rows for objects. */
export function getOutputFieldsField(): DeepPartial<Field> {
	return {
		field: 'fields',
		name: '$t:operations.ai-text.fields',
		type: 'json',
		meta: {
			note: '$t:operations.ai-text.fields_note',
			width: 'full',
			interface: 'list',
			options: {
				editMode: 'inline',
				addLabel: '$t:add_field',
				fields: getRowFields(OUTPUT_FIELD_MAX_DEPTH),
			},
		},
	};
}

function getRowFields(depth: number): DeepPartial<Field>[] {
	const typeChoices = depth > 1 ? TYPE_CHOICES : TYPE_CHOICES.filter((c) => !NESTED_TYPES.includes(c.value));

	return [
		{
			field: 'name',
			name: '$t:name',
			type: 'string',
			meta: { width: 'half', interface: 'input', required: true, options: { font: 'monospace' } },
		},
		{
			field: 'type',
			name: '$t:type',
			type: 'string',
			schema: { default_value: 'string' },
			meta: { width: 'half', interface: 'select-dropdown', options: { choices: typeChoices } },
		},
		{
			field: 'description',
			name: '$t:description',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: { placeholder: '$t:operations.ai-text.field_description_note' },
			},
		},
		{
			field: 'choices',
			name: '$t:choices',
			type: 'csv',
			meta: {
				width: 'full',
				interface: 'tags',
				note: '$t:operations.ai-text.choices_note',
				conditions: [{ rule: { type: { _neq: 'string' } }, hidden: true }],
				options: { placeholder: '$t:operations.ai-text.choices_placeholder' },
			},
		},
		{
			field: 'required',
			name: '$t:required',
			type: 'boolean',
			schema: { default_value: true },
			meta: {
				width: 'full',
				interface: 'boolean',
				note: '$t:operations.ai-text.required_note',
				options: { label: '$t:operations.ai-text.required_label' },
			},
		},
		...(depth > 1
			? [
					{
						field: 'fields',
						name: '$t:operations.ai-text.nested_fields',
						type: 'json',
						meta: {
							width: 'full',
							interface: 'list',
							conditions: [{ rule: { type: { _nin: NESTED_TYPES } }, hidden: true }],
							options: {
								editMode: 'inline',
								addLabel: '$t:add_field',
								fields: getRowFields(depth - 1),
							},
						},
					} as DeepPartial<Field>,
				]
			: []),
	];
}

export function getFields(panel: Record<string, any>): DeepPartial<Field>[] {
	const choices = getModelChoices();
	const selected = choices.find((c) => c.value === panel['model']);

	return [
		{
			field: 'model',
			name: '$t:ai.flow_operations.model',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'select-dropdown',
				required: true,
				note: choices.length === 0 ? '$t:operations.ai-text.no_providers' : '$t:operations.ai-text.model_note',
				options: {
					choices: choices.map(({ text, value, icon }) => ({ text, value, icon })),
					allowOther: true,
					placeholder: '$t:ai.flow_operations.model_placeholder',
				},
			},
		},
		{
			field: 'prompt',
			name: '$t:ai.prompt',
			type: 'text',
			meta: {
				note: '$t:operations.ai-text.prompt_note',
				width: 'full',
				interface: 'input-multiline',
				required: true,
				options: {
					placeholder: '$t:operations.ai-text.prompt_placeholder',
				},
			},
		},
		{
			field: 'system',
			name: '$t:operations.ai-text.system',
			type: 'text',
			meta: {
				note: '$t:operations.ai-text.system_note',
				width: 'full',
				interface: 'input-multiline',
				options: {
					placeholder: '$t:operations.ai-text.system_placeholder',
				},
			},
		},
		{
			field: 'files',
			name: '$t:operations.ai-text.files',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'tags',
				hidden: selected?.attachment === false,
				note: '$t:operations.ai-text.files_note',
				options: {
					placeholder: '$t:operations.ai-text.files_placeholder',
					iconRight: 'attach_file',
				},
			},
		},
		getPermissionsField('$t:operations.ai-text.permissions_note', selected?.attachment === false),
		{
			field: 'output',
			name: '$t:operations.ai-text.output',
			type: 'string',
			schema: {
				default_value: 'text',
			},
			meta: {
				note: '$t:operations.ai-text.output_note',
				width: 'half',
				interface: 'select-radio',
				options: {
					choices: [
						{ text: '$t:text', value: 'text' },
						{ text: '$t:operations.ai-text.object', value: 'object' },
					],
				},
			},
		},
		{
			field: 'maxOutputTokens',
			name: '$t:operations.ai-text.max_output_tokens',
			type: 'integer',
			meta: {
				note: '$t:operations.ai-text.max_output_tokens_note',
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '$t:operations.ai-text.max_output_tokens_placeholder',
					min: 1,
				},
			},
		},
		{
			field: 'schema',
			name: '$t:operations.ai-text.schema',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
					placeholder: JSON.stringify(
						{
							type: 'object',
							properties: { alt: { type: 'string', description: 'Alt text under 125 characters' } },
							required: ['alt'],
						},
						null,
						2,
					),
				},
			},
		},
	];
}
