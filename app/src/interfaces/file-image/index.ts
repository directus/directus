import { defineInterface } from '@directus/shared/utils';
import InterfaceFileImage from './file-image.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'file-image',
	name: '$t:interfaces.file-image.image',
	description: '$t:interfaces.file-image.description',
	icon: 'insert_photo',
	component: InterfaceFileImage,
	types: ['uuid'],
	localTypes: ['file'],
	group: 'relational',
	relational: true,
	options: [
		{
			field: 'folder',
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'half',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
			schema: {
				default_value: undefined,
			},
		},
		{
			field: 'crop',
			name: '$t:interfaces.file-image.crop',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.file-image.crop_label',
				},
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'customAspectRatios',
			type: 'json',
			name: '$t:interfaces.file-image.custom_aspect_ratios',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: '$t:text',
							meta: {
								interface: 'system-input-translated-string',
								width: 'half',
								options: {
									placeholder: '$t:text',
								},
							},
						},
						{
							field: 'value',
							type: 'float',
							name: '$t:value',
							meta: {
								interface: 'input',
								options: {
									font: 'monospace',
									placeholder: '$t:value',
								},
								width: 'half',
							},
						},
					],
				},
			},
		},
	],
	recommendedDisplays: ['image'],
	preview: PreviewSVG,
});
