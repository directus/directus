import type { Style } from 'maplibre-gl';
export default <Style>{
	version: 8,
	sources: {
		__directus: {
			type: 'geojson',
			data: { type: 'FeatureCollection', features: [] },
			cluster: true,
			clusterRadius: 50,
			clusterMaxZoom: 12,
		},
	},
	layers: [
		{
			id: '__directus_points',
			type: 'circle',
			source: '__directus',
			filter: ['all', ['!has', 'point_count'], ['==', '$type', 'Point']],
			paint: {
				'circle-color': '#11b4da',
				'circle-radius': 4,
				'circle-stroke-width': 1,
				'circle-stroke-color': '#fff',
			},
		},
		{
			id: '__directus_polygons',
			type: 'line',
			source: '__directus',
			filter: ['all', ['!has', 'point_count'], ['==', '$type', 'Polygon']],
			paint: {
				'line-color': '#09f',
				'line-width': 2,
			},
		},
		{
			id: '__directus_lines',
			type: 'line',
			source: '__directus',
			filter: ['all', ['!has', 'point_count'], ['==', '$type', 'LineString']],
			paint: {
				'line-color': '#09f',
				'line-width': 3,
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
				'text-font': ['Noto Sans Regular'],
				'text-size': ['step', ['get', 'point_count'], 14, 100, 16, 750, 18],
			},
		},
	],
};
