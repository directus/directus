import type { Style } from 'maplibre-gl';
import { sources, mapbox_sources } from './sources';

export { default as dataStyle } from './style';
export { basemapNames, rootStyle };

const rootStyle: Style = {
	version: 8,
	glyphs:
		'https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf',
	sprite: 'https://rawgit.com/lukasmartinelli/osm-liberty/gh-pages/sprites/osm-liberty',
	layers: [],
	sources,
};

const basemapNames = Object.keys({ ...mapbox_sources, ...rootStyle.sources });
