import { expose } from 'comlink';
import { Buffer } from 'buffer';
import { coordEach } from '@turf/meta';
import wkx from 'wkx';

type geometryOptions = {
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	longitudeField?: string;
	latitudeField?: string;
	geometrySRID?: string;
};

type GeometryFormat = 'geojson' | 'csv' | 'wkt' | 'wkb' | 'twkb' | 'lnglat';
type GeometryParser = (entry: any) => wkx.Geometry | undefined;

function lnglatParser(options: geometryOptions): GeometryParser {
	return function (entry) {
		const [lng, lat] = [entry[options.longitudeField!], entry[options.latitudeField!]];
		if (lng == undefined || lat == undefined) return undefined;
		return new wkx.Point(lng, lat);
	};
}
function geojsonParser(options: geometryOptions): GeometryParser {
	return function (entry) {
		const geom = entry[options.geometryField!];
		if (geom == undefined) return undefined;
		return wkx.Geometry.parseGeoJSON(geom);
	};
}
function twkbParser(options: geometryOptions): GeometryParser {
	return function (entry) {
		const geom = entry[options.geometryField!];
		if (geom == undefined) return undefined;
		return wkx.Geometry.parseTwkb(Buffer.from(geom, 'hex'));
	};
}
function wktParser(options: geometryOptions): GeometryParser {
	return function (entry) {
		const geom = entry[options.geometryField!];
		if (geom == undefined) return undefined;
		return wkx.Geometry.parse(geom);
	};
}
function wkbParser(options: geometryOptions): GeometryParser {
	return function (entry) {
		const geom = entry[options.geometryField!];
		if (geom == undefined) return undefined;
		return wkx.Geometry.parse(Buffer.from(geom, 'hex'));
	};
}
function csvParser(options: geometryOptions): GeometryParser {
	return function (entry) {
		const geom = entry[options.geometryField!];
		if (geom == undefined) return undefined;
		return new wkx.Point(...geom.split(','));
	};
}

function getGeometryParser(options: geometryOptions): GeometryParser {
	switch (options.geometryFormat) {
		case 'geojson':
			return geojsonParser(options);
		case 'lnglat':
			return lnglatParser(options);
		case 'twkb':
			return twkbParser(options);
		case 'wkb':
			return wkbParser(options);
		case 'wkt':
			return wktParser(options);
		default:
			throw new Error('unimplemented format');
	}
}

function expand(bbox: GeoJSON.BBox, coord: [number, number]) {
	if (bbox[0] > coord[0]) bbox[0] = coord[0];
	if (bbox[1] > coord[1]) bbox[1] = coord[1];
	if (bbox[2] < coord[0]) bbox[2] = coord[0];
	if (bbox[3] < coord[1]) bbox[3] = coord[1];
}

type AllGeoJSON = GeoJSON.FeatureCollection & GeoJSON.Feature & GeoJSON.GeometryCollection & GeoJSON.Geometry;

function toGeoJSON(
	entries: any[],
	options: geometryOptions,
	onProgress: (p: number) => void
): GeoJSON.FeatureCollection {
	const parser = getGeometryParser(options);
	const project = (coord: any): any => coord; // TODO
	const geojson: GeoJSON.FeatureCollection = {
		type: 'FeatureCollection',
		features: [],
	};
	const bounds: GeoJSON.BBox = [Infinity, Infinity, -Infinity, -Infinity];
	const throttle = entries.length / 15;
	for (let i = 0; i < entries.length; i++) {
		if (i % throttle < 1) onProgress(i / entries.length);
		const geometry = parser(entries[i])?.toGeoJSON();
		if (!geometry) continue;
		coordEach(geometry as AllGeoJSON, (coord) => {
			[coord[0], coord[1]] = project(coord);
			expand(bounds, coord as [number, number]);
		});
		const properties = { ...entries[i] };
		delete properties[options.geometryField!];
		delete properties[options.longitudeField!];
		delete properties[options.latitudeField!];
		const feature = { type: 'Feature', properties, geometry };
		geojson.features.push(feature as GeoJSON.Feature);
	}
	onProgress(1);
	if (geojson.features.length > 0) {
		if (bounds.some((b) => +b > 90)) {
			throw new Error('Coordinates out of bounds');
		}
		geojson.bbox = bounds;
	}
	return geojson;
}

expose(toGeoJSON);
export type GeoJSONSerializer = typeof toGeoJSON;
