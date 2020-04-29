import { defineInterface } from '@/interfaces/define';
import InterfaceDateTime from './datetime.vue';

export default defineInterface(({ i18n }) => ({
	id: 'datetime',
	name: i18n.t('datetime'),
	icon: 'today',
	component: InterfaceDateTime,
	options: [],
}));
