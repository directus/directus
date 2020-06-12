import InterfaceTags from './tags.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'tags',
	name: i18n.t('tags'),
	icon: 'local_offer',
	component: InterfaceTags,
	types: ['array'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			width: 'half',
			interface: 'text-input',
		},
		{
			field: 'lowercase',
			name: i18n.t('lowercase'),
			width: 'half',
			interface: 'toggle',
		},
		{
			field: 'alphabetize',
			name: i18n.t('alphabetize'),
			width: 'half',
			interface: 'toggle',
		},
		{
			field: 'iconLeft',
			name: i18n.t('icon_left'),
			width: 'half',
			interface: 'icon',
		},
		{
			field: 'iconRight',
			name: i18n.t('icon_right'),
			width: 'half',
			interface: 'icon',
		},
		{
			field: 'presets',
			name: i18n.t('presets'),
			width: 'full',
			interface: 'text-input',
		},
		{
			field: 'allowCustom',
			name: i18n.t('allow_custom'),
			width: 'half',
			interface: 'toggle',
		},
	],
}));
