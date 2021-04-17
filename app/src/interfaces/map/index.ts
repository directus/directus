import { defineInterface } from '../define';
import InterfaceMap from './map.vue';
import { sources, mapbox_sources } from '@/layouts/map/styles/sources';

export default defineInterface({
	id: 'map',
	name: '$t:interfaces.map.map',
	description: '$t:interfaces.map.description',
	icon: 'map',
	component: InterfaceMap,
	types: ['json', 'csv', 'string', 'text', 'binary'],
	options: [
		{
			field: 'geometryType',
			name: '$t:interfaces.map.geometry_type',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ value: 'Point', text: '$t:interfaces.map.point' },
						{ value: 'LineString', text: '$t:interfaces.map.line_string' },
						{ value: 'Polygon', text: '$t:interfaces.map.polygon' },
					],
				},
			},
			schema: {
				default_value: 'Point',
			},
		},
		{
			field: 'multiGeometry',
			name: '$t:interfaces.map.multi_geometry',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'geometryFormat',
			name: '$t:layouts.map.geometry_format',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ value: 'geojson', text: 'GeoJSON' },
						{ value: 'postgis', text: 'PostGIS' },
						{ value: 'wkt', text: 'WKT' },
						{ value: 'ewkt', text: 'EWKT' },
						{ value: 'wkb', text: 'WKB' },
						{ value: 'ewkb', text: 'EWKB' },
						{ value: 'twkb', text: 'TWKB' },
						{ value: 'csv', text: 'CSV' },
					],
				},
			},
		},
		{
			field: 'projection',
			name: '$t:interfaces.map.projection',
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
		{
			field: 'latitude',
			name: '$t:interfaces.map.lat',
			type: 'decimal',
			meta: {
				width: 'half',
				interface: 'numeric',
				options: {
					placeholder: '$t:interfaces.map.lat_placeholder',
				},
			},
			schema: {
				default_value: 40.72803624,
			},
		},
		{
			field: 'longitude',
			name: '$t:interfaces.map.lng',
			type: 'decimal',
			meta: {
				width: 'half',
				interface: 'numeric',
				options: {
					placeholder: '$t:interfaces.map.lng_placeholder',
				},
			},
			schema: {
				default_value: -73.94896388,
			},
		},
		{
			field: 'zoom',
			name: '$t:interfaces.map.zoom',
			type: 'decimal',
			meta: {
				width: 'half',
				interface: 'numeric',
				options: {
					placeholder: '$t:interfaces.map.lng_placeholder',
				},
			},
			schema: {
				default_value: 8,
			},
		},
		{
			field: 'background',
			name: '$t:interfaces.map.background',
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
	],
	recommendedDisplays: [],
});
