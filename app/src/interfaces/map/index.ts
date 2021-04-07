import { defineInterface } from '../define';
import InterfaceMap from './map.vue';

export default defineInterface(({ i18n }) => ({
	id: 'map',
	name: i18n.t('interfaces.map.map'),
	description: i18n.t('interfaces.map.description'),
	icon: 'map',
	component: InterfaceMap,
	types: ['json', 'csv'],
	options: [
		{
			field: 'latitude',
			name: i18n.t('interfaces.map.lat'),
			type: 'decimal',
			meta: {
				width: 'half',
				interface: 'numeric',
				options: {
					placeholder: i18n.t('interfaces.map.lat_placeholder'),
				},
			},
			schema: {
				default_value: 40.72803624,
			},
		},
		{
			field: 'longitude',
			name: i18n.t('interfaces.map.lng'),
			type: 'decimal',
			meta: {
				width: 'half',
				interface: 'numeric',
				options: {
					placeholder: i18n.t('interfaces.map.lng_placeholder'),
				},
			},
			schema: {
				default_value: -73.94896388,
			},
		},
		{
			field: 'background',
			name: i18n.t('interfaces.map.background'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{
							text: 'a',
							value: 'a',
						},
					],
				},
			},
			schema: {
				default_value: 'a',
			},
		},
		{
			field: 'projection',
			name: i18n.t('interfaces.map.projection'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{
							text: 'a',
							value: 'a',
						},
					],
				},
			},
			schema: {
				default_value: 'a',
			},
		},
	],
	recommendedDisplays: [],
}));
