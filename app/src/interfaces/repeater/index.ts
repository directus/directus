import { defineInterface } from '../define';
import RepeaterOptions from './options.vue';
import InterfaceRepeater from './repeater.vue';

export default defineInterface({
	id: 'repeater',
	name: '$t:interfaces.repeater.repeater',
	description: '$t:interfaces.repeater.description',
	icon: 'replay',
	component: InterfaceRepeater,
	types: ['json'],
	options: RepeaterOptions,
});
