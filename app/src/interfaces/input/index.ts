import { defineInterface } from '@/interfaces/define';
import InterfaceInput from './input.vue';
import Options from './options.vue';

export default defineInterface({
	id: 'input',
	name: '$t:interfaces.input.input',
	description: '$t:interfaces.input.description',
	icon: 'text_fields',
	component: InterfaceInput,
	types: ['string', 'uuid', 'bigInteger', 'integer', 'float', 'decimal'],
	options: Options,
});
