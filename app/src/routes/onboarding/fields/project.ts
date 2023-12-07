import { DeepPartial, Field } from '@directus/types';

export const projectFields: DeepPartial<Field>[] = [
	{
		collection: 'onboarding',
		name: '$t:fields.directus_settings.project_name',
		field: 'project_name',
		type: 'string',
		schema: {
			max_length: 255,
		},
		meta: {
			interface: 'input',
			options: { placeholder: '$t:fields.directus_settings.project_name', trim: true },
			width: 'half',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:fields.directus_settings.project_descriptor',
		field: 'project_descriptor',
		type: 'string',
		meta: {
			interface: 'input',
			options: { placeholder: '$t:field_options.directus_settings.project_name_placeholder', trim: true },
			width: 'half',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:fields.directus_settings.project_logo',
		field: 'project_logo',
		type: 'uuid',
		meta: {
			special: ['file'],
			interface: 'file',
			options: { crop: false },
			width: 'half',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:fields.directus_settings.project_color',
		field: 'project_color',
		type: 'string',
		meta: {
			interface: 'select-color',
			options: { placeholder: '$t:fields.directus_settings.project_color', trim: true },
			width: 'half',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:fields.directus_settings.project_url',
		field: 'project_url',
		type: 'string',
		schema: {
			max_length: 255,
		},
		meta: {
			interface: 'input',
			options: { placeholder: '$t:fields.directus_settings.project_url', trim: true },
			width: 'full',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:onboarding.project.use_case',
		field: 'project_use_case',
		type: 'string',
		meta: {
			field: 'project_use_case',
			interface: 'select-radio',
			options: {
				choices: [
					{ text: '$t:onboarding.project.personal', value: 'personal' },
					{ text: '$t:onboarding.project.work', value: 'work' },
					{ text: '$t:onboarding.project.exploring', value: 'exploring' },
				],
			},
			width: 'full',
		},
	},
];
