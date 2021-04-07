import { defineInterface } from '@/interfaces/define';
import Scope from './scope.vue';

export default defineInterface(({ i18n }) => ({
	id: 'scope',
	name: i18n.t('scope'),
	icon: 'arrow_drop_down_circle',
	component: Scope,
	types: ['string'],
	options: [],
}));
