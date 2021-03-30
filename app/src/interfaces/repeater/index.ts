import { defineInterface } from '../define';
import InterfaceRepeater from './repeater.vue';
import RepeaterOptions from './options.vue';

export default defineInterface({
	id: 'repeater',
	name: '$t:interfaces.repeater.repeater',
	description: '$t:interfaces.repeater.description',
	icon: 'replay',
	component: InterfaceRepeater,
	types: ['json'],
	options: RepeaterOptions,
});
