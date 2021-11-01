import { AnyLayer } from 'maplibre-gl';
import colors from '@/styles/_colors.module.scss';
const { green, orange, yellow, black, white } = colors;
const color = ['case', ['==', ['get', 'mode'], 'static'], black, ['==', ['get', 'active'], 'true'], orange, green];

export default <AnyLayer[]>[
	{
		id: 'directus-polygon-fill',
		type: 'fill',
		filter: ['all', ['==', '$type', 'Polygon']],
		paint: {
			'fill-color': color,
			'fill-outline-color': color,
			'fill-opacity': 0.15,
		},
	},
	{
		id: 'directus-polygon-stroke',
		type: 'line',
		filter: ['all', ['==', '$type', 'Polygon']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': color,
			'line-width': 2,
		},
	},
	{
		id: 'directus-polygon-midpoint',
		type: 'circle',
		filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
		paint: {
			'circle-radius': 3,
			'circle-color': orange,
		},
	},
	{
		id: 'directus-line',
		type: 'line',
		filter: ['all', ['==', '$type', 'LineString']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': color,
			'line-width': 2,
		},
	},
	{
		id: 'directus-polygon-and-line-vertex',
		type: 'circle',
		filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
		paint: {
			'circle-radius': 3,
			'circle-color': orange,
			'circle-opacity': ['case', ['==', ['get', 'active'], 'true'], 1, 0.2],
			'circle-stroke-color': ['case', ['==', ['get', 'active'], 'true'], white, orange],
			'circle-stroke-width': 2,
		},
	},
	{
		id: 'directus-point-shadow',
		filter: [
			'all',
			['==', '$type', 'Point'],
			['==', 'meta', 'feature'],
			['!=', 'meta', 'midpoint'],
			['!=', 'mode', 'static'],
		],
		type: 'circle',
		layout: {},
		paint: {
			'circle-radius': 10,
			'circle-blur': 1,
			'circle-opacity': 0.9,
			'circle-color': black,
		},
	},
	{
		id: 'directus-point',
		filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'meta', 'midpoint']],
		type: 'circle',
		layout: {},
		paint: {
			'circle-radius': 6,
			'circle-color': color,
			'circle-stroke-color': ['case', ['==', ['get', 'mode'], 'static'], black, white],
			'circle-opacity': ['case', ['==', ['get', 'mode'], 'static'], 0.2, 1],
			'circle-stroke-width': 2,
			'circle-stroke-opacity': 1,
		},
	},
];
