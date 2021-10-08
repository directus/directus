import { defineInterface } from '@directus/shared/utils';
import Options from './options.vue';
import InterfaceSelectRadio from './select-radio.vue';

export default defineInterface({
	id: 'select-radio',
	name: '$t:interfaces.select-radio.radio-buttons',
	description: '$t:interfaces.select-radio.description',
	icon: 'radio_button_checked',
	component: InterfaceSelectRadio,
	types: ['string', 'bigInteger', 'integer', 'float', 'decimal'],
	recommendedDisplays: ['badge'],
	options: Options,
});
