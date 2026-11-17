import { defineInterface } from '@directus/extensions';
import { getCardSelectOptions } from '../select-card/options';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectCardRadio from './select-card-radio.vue';

export default defineInterface({
	id: 'select-card-radio',
	name: '$t:interfaces.select-card-radio.card-select',
	description: '$t:interfaces.select-card-radio.description',
	icon: 'playlist_add_check_circle',
	component: InterfaceSelectCardRadio,
	types: ['string', 'integer', 'float', 'bigInteger'],
	recommendedDisplays: ['badge'],
	group: 'selection',
	preview: PreviewSVG,
	options: ({ field }) => getCardSelectOptions('select-card-radio', field.type ?? 'string'),
});
