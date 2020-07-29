import { defineInterface } from '@/interfaces/define';
import InterfaceSlug from './slug.vue';

export default defineInterface(({ i18n }) => ({
	id: 'slug',
	name: i18n.t('slug'),
	icon: 'link',
	component: InterfaceSlug,
	types: ['string'],
	options: [],
}));
