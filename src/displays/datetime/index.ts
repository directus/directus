import { defineDisplay } from '@/displays/define';
import DisplayDateTime from './datetime.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'datetime',
	name: i18n.t('datetime'),
	icon: 'query_builder',
	handler: DisplayDateTime,
	options: [],
	types: ['datetime', 'date', 'time'],
}));
