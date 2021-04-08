import { defineInterface } from '../define';
import InterfaceMap from './map.vue';
import { sources, mapbox_sources } from '@/layouts/map/styles/sources';

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
			field: 'zoom',
			name: i18n.t('interfaces.map.zoom'),
			type: 'decimal',
			meta: {
				width: 'half',
				interface: 'numeric',
				options: {
					placeholder: i18n.t('interfaces.map.lng_placeholder'),
				},
			},
			schema: {
				default_value: 8,
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
					choices: Object.keys({ ...mapbox_sources, ...sources }).map((choice) => ({ value: choice, text: choice })),
				},
			},
			schema: {
				default_value: 'CartoDB_PositronNoLabels',
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
						{ value: 'EPSG:4326', text: 'WGS84' },
						{ value: 'EPSG:4269', text: 'EPSG:4269' },
						{ value: 'EPSG:3857', text: 'EPSG:3857' },
					],
				},
			},
			schema: {
				default_value: 'EPSG:4326',
			},
		},
	],
	recommendedDisplays: [],
}));
