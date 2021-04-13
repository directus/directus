import type { Style } from 'maplibre-gl';

let baseColor = '#09f'; // '#11b4da'
let hoverColor = '#FFA500'; // '#11b4da'
let selectColor = '#FFA500'; // '#11b4da'
let color = ['case', ['boolean', ['feature-state', 'selected'], false], selectColor, baseColor];

export const style = <Style>{
	version: 8,
	sources: {
		__directus: {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] },
		},
	},
	layers: [
		{
			id: '__directus_polygons',
			type: 'line',
			source: '__directus',
			filter: ['all', ['!has', 'point_count'], ['==', '$type', 'Polygon']],
			paint: {
				'line-color': color,
				'line-width': 2,
			},
		},
		{
			id: '__directus_lines',
			type: 'line',
			source: '__directus',
			filter: ['all', ['!has', 'point_count'], ['==', '$type', 'LineString']],
			paint: {
				'line-color': color,
				'line-width': 2,
			},
		},
		{
			id: '__directus_points',
			type: 'symbol',
			source: '__directus',
			filter: ['all', ['!has', 'point_count'], ['==', '$type', 'Point']],
			layout: {
				'icon-image': 'place',
				'icon-anchor': 'bottom',
				'icon-allow-overlap': true,
				'icon-pitch-alignment': 'viewport',
				'icon-size': 2,
				'icon-offset': [0, 3],
			},
			paint: {
				'icon-color': color,
			},
		},
		{
			id: '__directus_clusters',
			type: 'circle',
			source: '__directus',
			filter: ['has', 'point_count'],
			paint: {
				'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 100, '#f1f075', 750, '#f28cb1'],
				'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
			},
		},
		{
			id: '__directus_cluster_count',
			type: 'symbol',
			source: '__directus',
			filter: ['has', 'point_count'],
			layout: {
				'text-field': '{point_count_abbreviated}',
				'text-font': ['Open Sans Semibold'],
				'text-size': ['step', ['get', 'point_count'], 15, 100, 17, 750, 19],
			},
		},
	],
};
