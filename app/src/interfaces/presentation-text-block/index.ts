import { defineInterface } from '@directus/shared/utils';
import InterfacePresentationTextBlock from './presentation-text-block.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'presentation-text-block',
	name: '$t:interfaces.presentation-text-block.text-block',
	description: '$t:interfaces.presentation-text-block.description',
	icon: 'notes',
	component: InterfacePresentationTextBlock,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: [
		{
			field: 'text',
			name: '$t:interfaces.presentation-text-block.text',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-multiline',
				options: {
					placeholder: '$t:interfaces.presentation-text-block.text_placeholder',
				},
			},
		},
	],
	preview: PreviewSVG,
});
