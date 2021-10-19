import { defineInterface } from '@directus/shared/utils';
import InterfaceInput from './input.vue';
import Options from './options.vue';
import Preview from './preview.svg?raw';

export default defineInterface({
	id: 'input',
	name: '$t:interfaces.input.input',
	description: '$t:interfaces.input.description',
	icon: 'text_fields',
	component: InterfaceInput,
	types: ['string', 'uuid', 'bigInteger', 'integer', 'float', 'decimal', 'text'],
	group: 'standard',
	options: Options,
	preview: Preview,
});
