import type { Feature, FeatureCollection, Geometry, GeometryCollection, Point, BBox } from 'geojson';
import { render } from 'micromustache';
import { coordEach } from '@turf/meta';
import { i18n } from '@/lang';
import proj4 from 'proj4';
import wkx from 'wkx';

export type GeometryOptions = {
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	longitudeField?: string;
	latitudeField?: string;
	geometryCRS?: string;
};

export type GeometryFormat = 'geojson' | 'postgis' | 'csv' | 'wkt' | 'ewkt' | 'wkb' | 'ewkb' | 'twkb' | 'lnglat';
export type AnyGeoJSON = FeatureCollection | Feature | GeometryCollection | Geometry;
export type AllGeoJSON = FeatureCollection & Feature & GeometryCollection & Geometry;
type GeometryParser = (entry: any) => wkx.Geometry | undefined;
type GeoJSONParser = (entry: any) => Geometry | GeometryCollection | undefined;
type Coord = [number, number];

function lnglatParser(options: GeometryOptions): GeometryParser {
	return function (entry: any) {
		const [lng, lat] = [entry[options.longitudeField!], entry[options.latitudeField!]];
		return lng && lat && new wkx.Point(lng, lat);
	};
}
function geojsonParser(options: GeometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parseGeoJSON(geom);
	};
}
function twkbParser(options: GeometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parseTwkb(Buffer.from(geom, 'hex'));
	};
}
function wktParser(options: GeometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parse(geom);
	};
}
function wkbParser(options: GeometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parse(Buffer.from(geom, 'hex'));
	};
}
function csvParser(options: GeometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && new wkx.Point(...[Number(geom[0]), Number(geom[1])]);
	};
}

export function getGeometryParser(options: GeometryOptions): GeometryParser {
	switch (options.geometryFormat) {
		case 'geojson':
			return geojsonParser(options);
		case 'lnglat':
			return lnglatParser(options);
		case 'twkb':
			return twkbParser(options);
		case 'postgis':
		case 'ewkb':
		case 'wkb':
			return wkbParser(options);
		case 'ewkt':
		case 'wkt':
			return wktParser(options);
		case 'csv':
			return csvParser(options);
		default:
			throw new Error(i18n.t('unimplemented_format') as string);
	}
}

export function getGeometrySerializer(options: GeometryOptions): (entry: AnyGeoJSON) => any {
	switch (options.geometryFormat) {
		case 'geojson':
			return (entry) => wkx.Geometry.parseGeoJSON(entry).toGeoJSON();
		case 'wkb':
			return (entry) => wkx.Geometry.parseGeoJSON(entry).toWkb();
		case 'ewkb':
			return (entry) => wkx.Geometry.parseGeoJSON(entry).toEwkb();
		case 'twkb':
			return (entry) => wkx.Geometry.parseGeoJSON(entry).toTwkb();
		case 'wkt':
			return (entry) => wkx.Geometry.parseGeoJSON(entry).toWkt();
		case 'postgis':
		case 'ewkt':
			return (entry) => wkx.Geometry.parseGeoJSON(entry).toEwkt();
		case 'csv':
			return (entry) => (entry as GeoJSON.Point).coordinates;
		default:
			throw new Error(i18n.t('unimplemented_format') as string);
	}
}

export function getSerializer(options: GeometryOptions) {
	const serialize = getGeometrySerializer(options);
	const project = (coord: Coord) => proj4(options.geometryCRS!, coord);

	return function (entry: AnyGeoJSON) {
		if (options.geometryCRS && options.geometryCRS !== 'EPSG:4326') {
			coordEach(entry as AllGeoJSON, (coord) => {
				[coord[0], coord[1]] = project(coord as Coord);
			});
		}
		return serialize(entry);
	};
}

export function expand(bbox: BBox, coord: Coord) {
	if (bbox[0] > coord[0]) bbox[0] = coord[0];
	if (bbox[1] > coord[1]) bbox[1] = coord[1];
	if (bbox[2] < coord[0]) bbox[2] = coord[0];
	if (bbox[3] < coord[1]) bbox[3] = coord[1];
}

export function assignBBox(object: AnyGeoJSON) {
	object.bbox = [Infinity, Infinity, -Infinity, -Infinity];
	coordEach(object as AllGeoJSON, (coord) => {
		expand(object.bbox!, coord as Coord);
	});
}

export function getParser(options: GeometryOptions): GeoJSONParser {
	const parse = getGeometryParser(options);
	const project = (coord: Coord) => proj4(options.geometryCRS!, 'EPSG:4326', coord);

	return function (entry: any) {
		const geom = parse(entry)?.toGeoJSON() as Geometry | GeometryCollection;
		if (!geom) return undefined;
		geom.bbox = [Infinity, Infinity, -Infinity, -Infinity];
		if (options.geometryCRS && options.geometryCRS !== 'EPSG:4326') {
			coordEach(geom as AllGeoJSON, (coord) => {
				[coord[0], coord[1]] = project(coord as Coord);
				expand(geom.bbox!, coord as Coord);
			});
		} else {
			assignBBox(geom);
		}
		return geom;
	};
}

export function toGeoJSON(entries: any[], options: GeometryOptions, template: string): GeoJSON.FeatureCollection {
	const parser = getParser(options);
	const geojson: GeoJSON.FeatureCollection = {
		type: 'FeatureCollection',
		features: [],
		bbox: [Infinity, Infinity, -Infinity, -Infinity],
	};
	const throttle = entries.length / 15;
	for (let i = 0; i < entries.length; i++) {
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
	if (geojson.features.length == 0) {
		delete geojson.bbox;
	}
	return geojson;
}
