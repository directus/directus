import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many-reference.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many-reference',
	name: i18n.t('interfaces.many-to-many-reference.many-to-many-reference'),
	description: i18n.t('interfaces.many-to-many-reference.description'),
	icon: 'local_offer',
	component: InterfaceManyToMany,
	relationship: 'm2m',
	types: ['alias'],
	localTypes: ['m2m'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
			},
		},
		{
			field: 'referencingField',
			name: i18n.t('interfaces.many-to-many-reference.reference-field'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('interfaces.many-to-many-reference.reference-field'),
				},
			},
		},
		{
			field: 'alphabetize',
			name: i18n.t('interfaces.tags.alphabetize'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.tags.alphabetize_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'allowCustom',
			name: i18n.t('interfaces.dropdown.allow_other'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.dropdown.allow_other_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'iconLeft',
			name: i18n.t('icon_left'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: i18n.t('icon_right'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
	recommendedDisplays: ['related-values'],
}));
