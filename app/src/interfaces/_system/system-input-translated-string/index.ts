import InterfaceInputTranslatedString from './input-translated-string.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-input-translated-string',
	name: '$t:interfaces.input-translated-string.input-translated-string',
	description: '$t:interfaces.input-translated-string.description',
	icon: 'translate',
	component: InterfaceInputTranslatedString,
	system: true,
	types: ['string', 'text'],
	group: 'standard',
	preview: PreviewSVG,
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
	],
});
