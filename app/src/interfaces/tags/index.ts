import InterfaceTags from './tags.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'tags',
	name: i18n.t('tags'),
	icon: 'local_offer',
	component: InterfaceTags,
	types: ['json'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
			}
		},
		{
			field: 'lowercase',
			name: i18n.t('lowercase'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			}
		},
		{
			field: 'alphabetize',
			name: i18n.t('alphabetize'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			}
		},
		{
			field: 'iconLeft',
			name: i18n.t('icon_left'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			}
		},
		{
			field: 'iconRight',
			name: i18n.t('icon_right'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			}
		},
		{
			field: 'presets',
			name: i18n.t('presets'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
			}
		},
		{
			field: 'allowCustom',
			name: i18n.t('allow_custom'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			}
		},
	],
}));
