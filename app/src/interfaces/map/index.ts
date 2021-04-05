import { defineInterface } from '../define';
import InterfaceMap from './map.vue';

const mapsAddressServiceLink = '<a href="https://wiki.openstreetmap.org/wiki/Nominatim">Nominatim</a>';

export default defineInterface(({ i18n }) => ({
	id: 'map',
	name: i18n.t('interfaces.map.map'),
	description: i18n.t('interfaces.map.description'),
	icon: 'map',
	recommendedDisplays: ['formatted-json-value'],
	component: InterfaceMap,
	types: ['json', 'csv'],
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
			field: 'max-markers',
			name: i18n.t('interfaces.map.max-markers'),
			type: 'integer',
			meta: {
				width: 'half',
				interface: 'numeric',
				options: {
					min: 1,
				},
			},
			schema: {
				default_value: 1,
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
					label: i18n.t('interfaces.map.custom_titles_hint'),
					allowOther: true,
					choices: [
						{
							text: 'OpenStreetMaps',
							value: '',
						},
						{
							text: i18n.t('Colored'),
							value: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
						},
						{
							text: i18n.t('Grayscale'),
							value: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
						},
						{
							text: i18n.t('Dark'),
							value: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
						},
						{
							text: i18n.t('Topography'),
							value: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
						},
						{
							text: i18n.t('Terrain'),
							value: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
						},
					],
				},
			},
			schema: {
				default_value: '',
			},
		},
		{
			field: 'height',
			name: i18n.t('interfaces.map.height'),
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
			field: 'addressToCode',
			name: i18n.t('interfaces.map.address-to-code'),
			type: 'boolean',
			meta: {
				width: 'half-left',
				interface: 'toggle',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'address-input-note',
			type: 'alias',
			meta: {
				width: 'full',
				interface: 'notice',
				options: {
					text: i18n.t('interfaces.map.address-input-note').toString().replace('{service}', mapsAddressServiceLink),
				},
			},
		},
	],
}));
