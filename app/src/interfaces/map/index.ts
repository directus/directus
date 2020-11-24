import { defineInterface } from '../define';
import InterfaceMap from './map.vue';

const mapsAddressServiceLink = '<a href="https://wiki.openstreetmap.org/wiki/Nominatim">Nominatim</a>';

export default defineInterface(({ i18n }) => ({
	id: 'map',
	name: i18n.t('interfaces.map.map'),
	description: i18n.t('interfaces.map.description'),
	icon: 'map',
	component: InterfaceMap,
	types: ['csv', 'json'],
	options: [
		{
			field: 'lat',
			name: i18n.t('interfaces.map.lat'),
			type: 'float',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
			schema: {
				default_value: 40.72803624,
			},
		},
		{
			field: 'lng',
			name: i18n.t('interfaces.map.lng'),
			type: 'float',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
			schema: {
				default_value: -73.94896388,
			},
		},
		{
			field: 'zoom',
			name: i18n.t('interfaces.map.zoom'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
			schema: {
				default_value: 12,
			},
		},
		{
			field: 'maxZoom',
			name: i18n.t('interfaces.map.max-zoom'),
			type: 'float',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
			schema: {
				default_value: 17,
			},
		},
		{
			field: 'marker',
			name: i18n.t('interfaces.map.marker'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: i18n.t('Center'), value: 'center' },
						{ text: i18n.t('Pin'), value: 'pin' },
						{ text: i18n.t('Multiple Pins'), value: 'pins' },
					],
				},
			},
			schema: {
				default_value: 'pin',
			},
		},
		{
			field: 'addressToCode',
			name: i18n.t('interfaces.map.address-to-code'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n
						.t('interfaces.map.addres-input-note')
						.toString()
						.replace('{service}', mapsAddressServiceLink),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'height',
			name: i18n.t('height'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
			},
			schema: {
				default_value: 400,
			},
		},
		{
			field: 'theme',
			name: i18n.t('interfaces.map.theme'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					allowOther: true,
					choices: [
						{
							text: 'OpenStreetMaps',
							value: '',
						},
						{
							text: i18n.t('Colored'),
							value: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
						},
						{
							text: i18n.t('Grayscale'),
							value: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
						},
						{
							text: i18n.t('Dark'),
							value: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
						},
						{
							text: i18n.t('Terrain'),
							value: 'https://tile.stamen.com/terrain/{z}/{x}/{y}.jpg',
						},
					],
				},
			},
			schema: {
				default_value: '',
			},
		},
	],
	recommendedDisplays: [],
}));
