import { defineInterface } from '@directus/shared/utils';
import InterfacePresentationExternalImages from './presentation-external-images.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'presentation-external-images',
	name: '$t:interfaces.presentation-external-images.presentation-external-images',
	description: '$t:interfaces.presentation-external-images.description',
	icon: 'smart_button',
	component: InterfacePresentationExternalImages,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: ({ collection }) => [
		{
			field: 'images',
			name: '$t:interfaces.presentation-external-images.images',
			type: 'json',
			meta: {
				interface: 'list',
				options: {
					fields: [
						{
							field: 'src',
							type: 'string',
							name: '$t:interfaces.presentation-external-images.src',
							meta: {
								width: 'half',
								options: {
									placeholder: '$t:interfaces.presentation-external-images.src-placeholder',
								},
							},
						},
						{
							field: 'width',
							type: 'string',
							name: '$t:interfaces.presentation-external-images.width',
							meta: {
								width: 'half',
								options: {
									placeholder: '$t:interfaces.presentation-external-images.width-placeholder',
								},
							},
						},
					],
				},
			},
		},
	],
	preview: PreviewSVG,
});
