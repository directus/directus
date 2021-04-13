import { expose } from 'comlink';
import { Buffer } from 'buffer';
import { render } from 'micromustache';
import { geometryOptions, getParser, expand } from '@/layouts/map/lib';

function toGeoJSON(
	entries: any[],
	options: geometryOptions,
	template: string,
	onProgress: (p: number) => void
): GeoJSON.FeatureCollection {
	const parser = getParser(options);
	const geojson: GeoJSON.FeatureCollection = {
		type: 'FeatureCollection',
		features: [],
		bbox: [Infinity, Infinity, -Infinity, -Infinity],
	};
	const throttle = entries.length / 15;
	for (let i = 0; i < entries.length; i++) {
		if (i % throttle < 1) onProgress(i / entries.length);
		const geometry = parser(entries[i]);
		if (!geometry) continue;
		const bbox = geometry.bbox!;
		expand(geojson.bbox!, [bbox[0], bbox[1]]);
		expand(geojson.bbox!, [bbox[2], bbox[3]]);
		const properties = { ...entries[i] };
		delete properties[options.geometryField!];
		delete properties[options.longitudeField!];
		delete properties[options.latitudeField!];
		properties.description = render(template, entries[i]);
		const feature = { type: 'Feature', properties, geometry };
		geojson.features.push(feature as GeoJSON.Feature);
	}
	onProgress(1);
	if (geojson.features.length == 0) {
		delete geojson.bbox;
	}
	return geojson;
}

expose(toGeoJSON);
export type GeoJSONSerializer = typeof toGeoJSON;
