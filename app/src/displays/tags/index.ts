import { defineDisplay } from '@/displays/define';
import DisplayTags from './tags.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'tags',
	name: i18n.t('tags'),
	types: ['json'],
	icon: 'label',
	handler: DisplayTags,
	options: [
		{
			field: 'format',
			name: i18n.t('format_text'),
			type: 'boolean',
			system: {
				width: 'half',
				interface: 'toggle',
				default_value: true,
			}
		},
	],
}));
