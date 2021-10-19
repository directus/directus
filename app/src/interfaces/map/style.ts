const black = '#000000';
const white = '#ffffff';
const green = '#00c897';
const orange = '#ee9746';

export default [
	{
		id: 'directus-polygon-fill-inactive',
		type: 'fill',
		filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
		paint: {
			'fill-color': green,
			'fill-outline-color': green,
			'fill-opacity': 0.1,
		},
	},
	{
		id: 'directus-polygon-fill-active',
		type: 'fill',
		filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
		paint: {
			'fill-color': orange,
			'fill-outline-color': orange,
			'fill-opacity': 0.1,
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
		id: 'directus-polygon-stroke-inactive',
		type: 'line',
		filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': green,
			'line-width': 2,
		},
	},
	{
		id: 'directus-polygon-stroke-active',
		type: 'line',
		filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': orange,
			'line-dasharray': [0.2, 2],
			'line-width': 2,
		},
	},
	{
		id: 'directus-line-inactive',
		type: 'line',
		filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': green,
			'line-width': 2,
		},
	},
	{
		id: 'directus-line-active',
		type: 'line',
		filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': orange,
			'line-dasharray': [0.2, 2],
			'line-width': 2,
		},
	},
	{
		id: 'directus-polygon-and-line-vertex-stroke-inactive',
		type: 'circle',
		filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
		paint: {
			'circle-radius': 5,
			'circle-color': '#fff',
		},
	},
	{
		id: 'directus-polygon-and-line-vertex-inactive',
		type: 'circle',
		filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
		paint: {
			'circle-radius': 3,
			'circle-color': orange,
		},
	},
	{
		id: 'directus-point-shadow',
		filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature'], ['!=', 'meta', 'midpoint']],
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
		id: 'directus-point-inactive',
		filter: [
			'all',
			['==', '$type', 'Point'],
			['==', 'active', 'false'],
			['==', 'meta', 'feature'],
			['!=', 'meta', 'midpoint'],
		],
		type: 'circle',
		layout: {},
		paint: {
			'circle-radius': 6,
			'circle-color': green,
			'circle-stroke-color': white,
			'circle-stroke-width': 2,
		},
	},
	{
		id: 'directus-point-active',
		filter: [
			'all',
			['==', '$type', 'Point'],
			['==', 'active', 'true'],
			['==', 'meta', 'feature'],
			['!=', 'meta', 'midpoint'],
		],
		type: 'circle',
		layout: {},
		paint: {
			'circle-radius': 6,
			'circle-color': orange,
			'circle-stroke-color': white,
			'circle-stroke-width': 2,
		},
	},
	{
		id: 'directus-point-static',
		type: 'circle',
		filter: [
			'all',
			['==', '$type', 'Point'],
			['==', 'mode', 'static'],
			['==', 'meta', 'feature'],
			['!=', 'meta', 'midpoint'],
		],
		layout: {},
		paint: {
			'circle-radius': 6,
			'circle-color': '#404040',
			'circle-stroke-color': '#101010',
			'circle-stroke-width': 2,
		},
	},
	{
		id: 'directus-polygon-fill-static',
		type: 'fill',
		filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
		paint: {
			'fill-color': '#404040',
			'fill-outline-color': '#404040',
			'fill-opacity': 0.1,
		},
	},
	{
		id: 'directus-polygon-stroke-static',
		type: 'line',
		filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': '#404040',
			'line-width': 2,
		},
	},
	{
		id: 'directus-line-static',
		type: 'line',
		filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
		layout: {
			'line-cap': 'round',
			'line-join': 'round',
		},
		paint: {
			'line-color': '#404040',
			'line-width': 2,
		},
	},
];
