import { DatabaseType } from '@/types';
import type { Feature, FeatureCollection, Geometry, GeometryCollection, BBox } from 'geojson';
import { render } from 'micromustache';
import { coordEach } from '@turf/meta';
import { i18n } from '@/lang';
import proj4 from 'proj4';
import wkx from 'wkx';

export const geometryTypes = [
	'Point',
	'LineString',
	'Polygon',
	'MultiPoint',
	'MultiLineString',
	'MultiPolygon',
	'Any',
] as const;
export const geometryFormats = ['native', 'geojson', 'wkt', 'wkb', 'lnglat'] as const;
export type GeometryType = typeof geometryTypes[number];
export type GeometryFormat = typeof geometryFormats[number];

export type GeometryOptions = {
	geometryField: string;
	geometryFormat: GeometryFormat;
	geometryType: GeometryType;
	geometryCRS?: string;
};

export type AnyGeoJSON = FeatureCollection | Feature | GeometryCollection | Geometry;
export type AllGeoJSON = FeatureCollection & Feature & GeometryCollection & Geometry;
export type GeoJSONParser = (entry: any) => Geometry | GeometryCollection | undefined;
export type GeoJSONSerializer = (entry: Geometry | GeometryCollection) => any;
type Coord = [number, number];

export function compatibleFormatsForType(type: DatabaseType): GeometryFormat[] {
	switch (type) {
		case 'geometry':
			return ['native'];
		case 'json':
			return ['geojson'];
		case 'text':
		case 'string':
			return ['wkt'];
		case 'binary':
			return ['wkb'];
		case 'csv':
			return ['lnglat'];
		default:
			return [];
	}
}

export function getGeometryParser(geometryFormat: GeometryFormat): (geom: any) => AnyGeoJSON {
	switch (geometryFormat) {
		case 'native':
		case 'wkt':
			return (geom: any) => wkx.Geometry.parse(geom).toGeoJSON() as AnyGeoJSON;
		case 'wkb':
			return (geom: any) => wkx.Geometry.parse(Buffer.from(geom, 'hex')).toGeoJSON() as AnyGeoJSON;
		case 'lnglat':
			return (geom: any) => new wkx.Point(Number(geom[0]), Number(geom[1])).toGeoJSON() as AnyGeoJSON;
		case 'geojson':
			return (geom: any) => geom;
		default:
			throw new Error(i18n.t('interfaces.map.invalid_format', { format: geometryFormat }) as string);
	}
}

export function getGeometrySerializer(geometryFormat: GeometryFormat): (entry: AnyGeoJSON) => any {
	switch (geometryFormat) {
		case 'native':
		case 'wkt':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toWkt();
		case 'wkb':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toWkb();
		case 'lnglat':
			return (entry: AnyGeoJSON) => (entry as GeoJSON.Point).coordinates;
		case 'geojson':
			return (entry: AnyGeoJSON) => entry;
		default:
			throw new Error(i18n.t('interfaces.map.invalid_format', { format: geometryFormat }) as string);
	}
}

function getProjecter(from?: string, to?: string): (coord: Coord) => Coord {
	try {
		if (!to || !from) return (coord: Coord) => coord;
		proj4.Proj(from), proj4.Proj(to);
		return (coord: Coord) => proj4(from, to, coord);
	} catch (error) {
		throw new Error(i18n.t('interfaces.map.invalid_crs', { crs: error }) as string);
	}
}

export function getSerializer(options: GeometryOptions): GeoJSONSerializer {
	const serialize = getGeometrySerializer(options.geometryFormat);
	const project = getProjecter('EPSG:4326', options.geometryCRS!);

	return function (entry: AnyGeoJSON) {
		if (options.geometryCRS && options.geometryCRS !== 'EPSG:4326') {
			coordEach(entry as AllGeoJSON, (coord) => {
				[coord[0], coord[1]] = project(coord as Coord);
			});
		}
		return serialize(entry);
	};
}

export function expand(bbox: BBox, coord: Coord): void {
	if (bbox[0] > coord[0]) bbox[0] = coord[0];
	if (bbox[1] > coord[1]) bbox[1] = coord[1];
	if (bbox[2] < coord[0]) bbox[2] = coord[0];
	if (bbox[3] < coord[1]) bbox[3] = coord[1];
}

export function assignBBox(object: AnyGeoJSON): void {
	object.bbox = [Infinity, Infinity, -Infinity, -Infinity];
	coordEach(object as AllGeoJSON, (coord) => {
		expand(object.bbox!, coord as Coord);
	});
}

export function getParser(options: GeometryOptions): GeoJSONParser {
	const parse = getGeometryParser(options.geometryFormat);
	const project = getProjecter(options.geometryCRS, 'EPSG:4326');

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
	} else if (geojson.bbox!.some((b) => Math.abs(b) > 90)) {
		throw new Error(i18n.t('interfaces.map.out_of_bounds', { coord: JSON.stringify(geojson.bbox) }) as string);
	}
	return geojson;
}
