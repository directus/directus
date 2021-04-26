import { defineInterface } from '@/interfaces/define';
import InterfaceSlug from './slug.vue';

export default defineInterface({
	id: 'slug',
	name: '$t:interfaces.slug.slug',
	description: '$t:interfaces.slug.description',
	icon: 'link',
	component: InterfaceSlug,
	types: ['string'],
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'iconLeft',
			name: '$t:icon_left',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: '$t:icon_right',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
});
