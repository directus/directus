import { defineInterface } from '../define';
import InterfaceManyToMany from './many-to-many.vue';

export default defineInterface(({ i18n }) => ({
	id: 'many-to-many',
	name: i18n.t('interfaces.many-to-many.many-to-many'),
	description: i18n.t('interfaces.many-to-many.description'),
	icon: 'note_add',
	component: InterfaceManyToMany,
	relationship: 'm2m',
	types: ['alias'],
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
	recommendedDisplays: ['related-values'],
}));
