import { defineInterface } from '@/interfaces/define';
import Scope from './scope.vue';

export default defineInterface({
	id: 'scope',
	name: '$t:scope',
	icon: 'arrow_drop_down_circle',
	component: Scope,
	types: ['string'],
	options: [],
});
