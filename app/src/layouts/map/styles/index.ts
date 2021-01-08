import type { Style } from 'maplibre-gl';
import sources from './sources';

export { default as dataStyle } from './style';
export { basemapNames, rootStyle };

const rootStyle: Style = {
	version: 8,
	glyphs:
		'https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf',
	layers: [],
	sources,
};

const basemapNames = Object.keys(rootStyle.sources!);
