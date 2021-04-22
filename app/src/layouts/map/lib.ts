import type { Feature, FeatureCollection, Geometry, GeometryCollection, Point, BBox } from 'geojson';
import { coordEach } from '@turf/meta';
import proj4 from 'proj4';
import wkx from 'wkx';
import { i18n } from '@/lang';

export type geometryOptions = {
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	longitudeField?: string;
	latitudeField?: string;
	geometrySRID?: string;
};

export type GeometryFormat = 'geojson' | 'postgis' | 'csv' | 'wkt' | 'ewkt' | 'wkb' | 'ewkb' | 'twkb' | 'lnglat';
export type AnyGeoJSON = FeatureCollection | Feature | GeometryCollection | Geometry;
export type AllGeoJSON = FeatureCollection & Feature & GeometryCollection & Geometry;
type GeometryParser = (entry: any) => wkx.Geometry | undefined;
type GeoJSONParser = (entry: any) => Geometry | GeometryCollection | undefined;
type Coord = [number, number];

function lnglatParser(options: geometryOptions): GeometryParser {
	return function (entry: any) {
		const [lng, lat] = [entry[options.longitudeField!], entry[options.latitudeField!]];
		return lng && lat && new wkx.Point(lng, lat);
	};
}
function geojsonParser(options: geometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parseGeoJSON(geom);
	};
}
function twkbParser(options: geometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parseTwkb(Buffer.from(geom, 'hex'));
	};
}
function wktParser(options: geometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parse(geom);
	};
}
function wkbParser(options: geometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && wkx.Geometry.parse(Buffer.from(geom, 'hex'));
	};
}
function csvParser(options: geometryOptions): GeometryParser {
	return function (entry: any) {
		const geom = entry[options.geometryField!];
		return geom && new wkx.Point(...[Number(geom[0]), Number(geom[1])]);
	};
}

export function getGeometryParser(options: geometryOptions): GeometryParser {
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
			throw i18n.t('unimplemented_format');
	}
}

export function getGeometrySerializer(options: geometryOptions): (entry: AnyGeoJSON) => any {
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
			throw i18n.t('unimplemented_format');
	}
}

export function getSerializer(options: geometryOptions) {
	const serialize = getGeometrySerializer(options);
	const project = (coord: Coord) => proj4(options.geometrySRID!, coord);

	return function (entry: AnyGeoJSON) {
		if (options.geometrySRID && options.geometrySRID !== 'EPSG:4326') {
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

export function getParser(options: geometryOptions): GeoJSONParser {
	const parse = getGeometryParser(options);
	const project = (coord: Coord) => proj4(options.geometrySRID!, 'EPSG:4326', coord);

	return function (entry: any) {
		const geom = parse(entry)?.toGeoJSON() as Geometry | GeometryCollection;
		if (!geom) return undefined;
		geom.bbox = [Infinity, Infinity, -Infinity, -Infinity];
		if (options.geometrySRID && options.geometrySRID !== 'EPSG:4326') {
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
