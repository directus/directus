import { defineInterface } from '@directus/extensions';
import InterfacePresentationNotice from './presentation-notice.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'presentation-notice',
	name: '$t:interfaces.presentation-notice.notice',
	description: '$t:interfaces.presentation-notice.description',
	icon: 'info',
	component: InterfacePresentationNotice,
	hideLabel: true,
	hideLoader: true,
	autoKey: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: [
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: '$t:normal', value: 'normal' },
						{ text: '$t:info', value: 'info' },
						{ text: '$t:success', value: 'success' },
						{ text: '$t:warning', value: 'warning' },
						{ text: '$t:danger', value: 'danger' },
					],
				},
			},
			schema: {
				default_value: 'normal',
			},
		},
		{
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'text',
			name: '$t:text',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:interfaces.presentation-notice.text',
				},
			},
		},
	],
	preview: PreviewSVG,
});
