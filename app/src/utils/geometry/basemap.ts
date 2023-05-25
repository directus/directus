import { Style, RasterSource } from 'maplibre-gl';
import { getTheme } from '@/utils/get-theme';
import { useSettingsStore } from '@/stores/settings';

export type BasemapSource = {
	name: string;
	type: 'raster' | 'tile' | 'style';
	url: string;
	tileSize?: number;
	attribution?: string;
};

export const defaultBasemap: BasemapSource = {
	name: 'OpenStreetMap',
	type: 'raster',
	url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	tileSize: 256,
	attribution: '© OpenStreetMap contributors',
};

const baseStyle: Style = {
	version: 8,
	glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
};

export function getBasemapSources(): BasemapSource[] {
	const settingsStore = useSettingsStore();

	if (settingsStore.settings?.mapbox_key) {
		return [getDefaultMapboxBasemap(), defaultBasemap, ...(settingsStore.settings?.basemaps || [])];
	}

	return [defaultBasemap, ...(settingsStore.settings?.basemaps || [])];
}

export function getStyleFromBasemapSource(basemap: BasemapSource): Style | string {
	if (basemap.type == 'style') {
		return basemap.url;
	} else {
		const style: Style = { ...baseStyle };
		const source: RasterSource = { type: 'raster' };
		if (basemap.attribution) source.attribution = basemap.attribution;

		if (basemap.type == 'raster') {
			source.tiles = expandUrl(basemap.url);
			source.tileSize = basemap.tileSize || 512;
		}

		if (basemap.type == 'tile') {
			source.url = basemap.url;
		}

		style.layers = [{ id: basemap.name, source: basemap.name, type: 'raster' }];
		style.sources = { [basemap.name]: source };
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

		for (const subdomain of subdomains) {
			urls.push(url.replace(match[0], subdomain));
		}

		return urls;
	}

	urls.push(url);
	return urls;
}

function getDefaultMapboxBasemap(): BasemapSource {
	const defaultMapboxBasemap: BasemapSource = {
		name: 'Mapbox',
		type: 'style',
		url: 'mapbox://styles/directus/cktaiz31c509n18nrxj63zdy6',
	};

	if (getTheme() === 'dark') {
		defaultMapboxBasemap.url = 'mapbox://styles/directus/cl0bombrr001115taz5ilsynw';
	}

	return defaultMapboxBasemap;
}
