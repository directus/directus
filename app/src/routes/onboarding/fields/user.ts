import { DeepPartial, Field } from '@directus/types';

export const userFields: DeepPartial<Field>[] = [
	{
		collection: 'onboarding',
		name: '$t:fields.directus_users.first_name',
		field: 'first_name',
		type: 'string',
		schema: {
			max_length: 50,
		},
		meta: {
			interface: 'input',
			options: { placeholder: '$t:fields.directus_users.first_name', trim: true },
			width: 'half',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:fields.directus_users.last_name',
		field: 'last_name',
		type: 'string',
		schema: {
			max_length: 50,
		},
		meta: {
			interface: 'input',
			options: { placeholder: '$t:fields.directus_users.last_name', trim: true },
			width: 'half',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:fields.directus_users.email',
		field: 'email',
		type: 'string',
		schema: {
			max_length: 255,
		},
		meta: {
			interface: 'input',
			options: { placeholder: '$t:fields.directus_users.email', trim: true },
			width: 'half',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:onboarding.user.mailinglist_name',
		field: 'wants_emails',
		type: 'boolean',
		meta: {
			interface: 'boolean',
			options: {
				label: '$t:onboarding.user.mailinglist_label',
			},
			width: 'half',
			note: '$t:onboarding.privacy_note',
		},
	},
	{
		collection: 'onboarding',
		name: '$t:onboarding.user.primary_skillset',
		field: 'primary_skillset',
		type: 'string',
		meta: {
			interface: 'select-radio',
			options: {
				choices: [
					{ text: '$t:onboarding.user.frontend', value: 'frontend' },
					{ text: '$t:onboarding.user.backend', value: 'backend' },
					{ text: '$t:onboarding.user.fullstack', value: 'fullstack' },
					{ text: '$t:onboarding.user.db_admin', value: 'db_admin' },
					{ text: '$t:onboarding.user.data_scientist', value: 'data_scientist' },
					{ text: '$t:onboarding.user.nontechnical', value: 'non_technical' },
				],
			},
			width: 'full',
		},
	},
];
