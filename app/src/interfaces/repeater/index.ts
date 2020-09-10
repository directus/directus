import { defineInterface } from '../define';
import InterfaceRepeater from './repeater.vue';
import RepeaterOptions from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'repeater',
	name: i18n.t('interfaces.repeater.repeater'),
	description: i18n.t('interfaces.repeater.description'),
	icon: 'replay',
	component: InterfaceRepeater,
	types: ['json'],
	options: RepeaterOptions,
}));
