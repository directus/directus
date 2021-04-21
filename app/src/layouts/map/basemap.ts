import { Style, RasterSource } from 'maplibre-gl';
import getSetting from '@/utils/get-setting';

export type BasemapSource = {
	name: string;
	type: 'raster' | 'tile' | 'style';
	url: string;
};

export function getBasemapSources(): BasemapSource[] {
	const basemaps = getSetting('basemaps');
	return basemaps?.length
		? basemaps
		: [
				{
					name: 'OpenStreetMap',
					type: 'raster',
					url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				},
		  ];
}

export function getStyleFromBasemapSource(background: BasemapSource) {
	if (background.type == 'style') {
		return background.url;
	} else {
		const style: Style = {
			version: 8,
			// glyphs: 'http://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
			glyphs:
				'https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_GCS_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf',
		};
		const source: RasterSource = { type: 'raster' };
		if (background.type == 'raster') {
			source.tiles = expandUrl(background.url);
		}
		if (background.type == 'tile') {
			source.url = background.url;
		}
		style.layers = [{ id: background.name, source: background.name, type: 'raster' }];
		style.sources = { [background.name]: source };
		return style;
	}
}

function expandUrl(url: string): string[] {
	const urls = [];
	let match = /\{([a-z])-([a-z])\}/.exec(url);
	if (match) {
		// char range
		const startCharCode = match[1].charCodeAt(0);
		const stopCharCode = match[2].charCodeAt(0);
		let charCode;
		for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
			urls.push(url.replace(match[0], String.fromCharCode(charCode)));
		}
		return urls;
	}
	match = /\{(\d+)-(\d+)\}/.exec(url);
	if (match) {
		// number range
		const stop = parseInt(match[2], 10);
		for (let i = parseInt(match[1], 10); i <= stop; i++) {
			urls.push(url.replace(match[0], i.toString()));
		}
		return urls;
	}
	match = /\{(([a-z0-9]+)(,([a-z0-9]+))+)\}/.exec(url);
	if (match) {
		// csv
		const subdomains = match[1].split(',');
		for (let subdomain of subdomains) {
			urls.push(url.replace(match[0], subdomain));
		}
		return urls;
	}
	urls.push(url);
	return urls;
}
