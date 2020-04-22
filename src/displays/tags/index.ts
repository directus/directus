import { defineDisplay } from '@/displays/define';
import DisplayTags from './tags.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'tags',
	name: i18n.t('tags'),
	types: ['array'],
	icon: 'label',
	handler: DisplayTags,
	options: null,
}));
