export default [
	{
		id: 'directus-polygon-fill-inactive',
		type: 'fill',
		filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
		paint: {
			'fill-color': '#3bb2d0',
			'fill-outline-color': '#3bb2d0',
			'fill-opacity': 0.1,
		},
	},
	{
		id: 'directus-polygon-fill-active',
		type: 'fill',
		filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
		paint: {
			'fill-color': '#fbb03b',
			'fill-outline-color': '#fbb03b',
			'fill-opacity': 0.1,
		},
	},
	{
		id: 'directus-polygon-midpoint',
		type: 'circle',
		filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
		paint: {
			'circle-radius': 3,
			'circle-color': '#fbb03b',
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
			'line-color': '#3bb2d0',
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
			'line-color': '#fbb03b',
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
			'line-color': '#3bb2d0',
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
			'line-color': '#fbb03b',
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
			'circle-color': '#fbb03b',
		},
	},
	{
		id: 'directus-point-inactive',
		filter: [
			'all',
			['==', 'active', 'false'],
			['==', '$type', 'Point'],
			['==', 'meta', 'feature'],
			['!=', 'meta', 'midpoint'],
		],
		type: 'symbol',
		layout: {
			'icon-image': 'place',
			'icon-anchor': 'bottom',
			'icon-allow-overlap': true,
			'icon-size': 2,
			'icon-offset': [0, 3],
		},
		paint: {
			'icon-color': '#3bb2d0',
		},
	},
	{
		id: 'directus-point-active',
		filter: [
			'all',
			['==', 'active', 'true'],
			['==', '$type', 'Point'],
			['==', 'meta', 'feature'],
			['!=', 'meta', 'midpoint'],
		],
		type: 'symbol',
		layout: {
			'icon-image': 'place',
			'icon-anchor': 'bottom',
			'icon-allow-overlap': true,
			'icon-size': 2,
			'icon-offset': [0, 3],
		},
		paint: {
			'icon-color': '#fbb03b',
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
	{
		id: 'directus-point-static',
		type: 'circle',
		filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Point']],
		paint: {
			'circle-radius': 5,
			'circle-color': '#404040',
		},
	},
];
