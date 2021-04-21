import type { Style } from 'maplibre-gl';
import { sources, mapbox_sources } from './sources';

export { style as dataStyle } from './style';
export { basemapNames, rootStyle };

const rootStyle: Style = {
	version: 8,
	glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
	layers: [],
	sources,
};

const basemapNames = Object.keys({ ...mapbox_sources, ...rootStyle.sources });
