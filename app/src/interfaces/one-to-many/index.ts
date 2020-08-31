import { defineInterface } from '../define';
import InterfaceOneToMany from './one-to-many.vue';

export default defineInterface(({ i18n }) => ({
	id: 'one-to-many',
	name: i18n.t('one_to_many'),
	icon: 'arrow_right_alt',
	component: InterfaceOneToMany,
	types: ['alias'],
	relationship: 'o2m',
	options: [
		{
			field: 'fields',
			type: 'json',
			name: i18n.tc('field', 0),
			meta: {
				interface: 'tags',
				width: 'full',
				options: {
					placeholder: i18n.t('readable_fields_copy'),
				},
			},
		},
	],
}));
