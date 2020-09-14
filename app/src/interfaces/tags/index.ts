import InterfaceTags from './tags.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'tags',
	name: i18n.t('interfaces.tags.tags'),
	description: i18n.t('interfaces.tags.description'),
	icon: 'local_offer',
	component: InterfaceTags,
	types: ['json', 'csv'],
	options: [
		{
			field: 'presets',
			name: i18n.t('presets'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'tags',
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
			field: 'lowercase',
			name: i18n.t('interfaces.tags.lowercase'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.tags.lowercase_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
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
	recommendedDisplays: ['tags'],
}));
