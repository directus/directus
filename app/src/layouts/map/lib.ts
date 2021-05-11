import { types } from '@/types';
import type { Feature, FeatureCollection, Geometry, GeometryCollection, BBox } from 'geojson';
import { render } from 'micromustache';
import { coordEach } from '@turf/meta';
import { i18n } from '@/lang';
import proj4 from 'proj4';
import wkx from 'wkx';

export type GeometryOptions = {
	geometryFormat: GeometryFormat;
	geometryField: string;
	geometryCRS?: string;
};

export const geometryTypes = [
	'Point',
	'LineString',
	'Polygon',
	'MultiPoint',
	'MultiLineString',
	'MultiPolygon',
] as const;
export type GeometryType = typeof geometryTypes[number];
export const geometryFormats = ['GeoJSON', 'PostGIS', 'WKT', 'EWKT', 'WKB', 'EWKB', 'TWKB', 'CSV'] as const;
export type GeometryFormat = typeof geometryFormats[number];
export type AnyGeoJSON = FeatureCollection | Feature | GeometryCollection | Geometry;
export type AllGeoJSON = FeatureCollection & Feature & GeometryCollection & Geometry;
export type GeoJSONParser = (entry: any) => Geometry | GeometryCollection | undefined;
export type GeoJSONSerializer = (entry: Geometry | GeometryCollection) => any;
type Coord = [number, number];

export function compatibleFormatsForType(type: typeof types[number]): GeometryFormat[] {
	switch (type) {
		case 'json':
			return ['GeoJSON'];
		case 'text':
		case 'string':
		case 'unknown':
			return ['WKT', 'EWKT', 'PostGIS'];
		case 'binary':
			return ['WKB', 'EWKB', 'TWKB'];
		case 'csv':
			return ['CSV'];
		default:
			return [];
	}
}

export function getGeometryParser(geometryFormat: GeometryFormat) {
	switch (geometryFormat) {
		case 'GeoJSON':
			return (geom: any) => wkx.Geometry.parseGeoJSON(geom).toGeoJSON();
		case 'EWKT':
		case 'WKT':
			return (geom: any) => wkx.Geometry.parse(geom).toGeoJSON();
		case 'EWKB':
		case 'WKB':
		case 'PostGIS':
			return (geom: any) => wkx.Geometry.parse(Buffer.from(geom, 'hex')).toGeoJSON();
		case 'TWKB':
			return (geom: any) => wkx.Geometry.parseTwkb(Buffer.from(geom, 'hex')).toGeoJSON();
		case 'CSV':
			return (geom: any) => new wkx.Point(...[Number(geom[0]), Number(geom[1])]).toGeoJSON();
		default:
			throw new Error(i18n.t('interfaces.map.unknown_format', { format: geometryFormat }) as string);
	}
}

export function getGeometrySerializer(geometryFormat: GeometryFormat) {
	switch (geometryFormat) {
		case 'GeoJSON':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toGeoJSON();
		case 'WKB':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toWkb();
		case 'EWKB':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toEwkb();
		case 'TWKB':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toTwkb();
		case 'WKT':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toWkt();
		case 'PostGIS':
		case 'EWKT':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toEwkt();
		case 'CSV':
			return (entry: AnyGeoJSON) => (entry as GeoJSON.Point).coordinates;
		default:
			throw new Error(i18n.t('interfaces.map.unknown_format', { format: geometryFormat }) as string);
	}
}

export function getSerializer(options: GeometryOptions) {
	const serialize = getGeometrySerializer(options.geometryFormat);
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
	const parse = getGeometryParser(options.geometryFormat);
	const project = (coord: Coord) => proj4(options.geometryCRS!, 'EPSG:4326', coord);

	return function (entry: any) {
		const geomRaw = entry[options.geometryField];
		const geom = geomRaw && (parse(geomRaw) as Geometry | GeometryCollection);
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
	for (let i = 0; i < entries.length; i++) {
		const geometry = parser(entries[i]);
		if (!geometry) continue;
		const bbox = geometry.bbox!;
		expand(geojson.bbox!, [bbox[0], bbox[1]]);
		expand(geojson.bbox!, [bbox[2], bbox[3]]);
		const properties = { ...entries[i] };
		delete properties[options.geometryField];
		properties.description = render(template, entries[i]);
		const feature = { type: 'Feature', properties, geometry };
		geojson.features.push(feature as GeoJSON.Feature);
	}
	if (geojson.features.length == 0) {
		delete geojson.bbox;
	}
	return geojson;
}
