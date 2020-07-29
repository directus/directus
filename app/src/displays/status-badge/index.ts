import { defineDisplay } from '@/displays/define';
import DisplayStatusBadge from './status-badge.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'status-badge',
	name: i18n.t('status_badge'),
	types: ['string'],
	icon: 'flag',
	handler: DisplayStatusBadge,
	options: null,
}));
