import { defineInterface } from '../define';
import InterfaceRepeater from './repeater.vue';

export default defineInterface(({ i18n }) => ({
	id: 'repeater',
	name: i18n.t('repeater'),
	icon: 'replay',
	component: InterfaceRepeater,
	types: ['json'],
	options: [],
}));
