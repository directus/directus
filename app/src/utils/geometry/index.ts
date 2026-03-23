import {
	AllGeoJSON,
	AnyGeometry,
	Coordinate,
	GeoJSONParser,
	GeoJSONSerializer,
	GeometryFormat,
	GeometryOptions,
	SimpleGeometry,
	Type,
} from '@directus/types';
import { coordEach } from '@turf/meta';
import { BBox, Feature, FeatureCollection, Point } from 'geojson';
import { stringify as geojsonToWKT, parse as wktToGeoJSON } from 'wellknown';
import { i18n } from '@/lang';

export function expandBBox(bbox: BBox, coord: Coordinate): BBox {
	return [
		Math.min(bbox[0], coord[0]),
		Math.min(bbox[1], coord[1]),
		Math.max(bbox[2], coord[0]),
		Math.max(bbox[3], coord[1]),
	];
}

export function getBBox(object: AnyGeometry): BBox {
	let bbox: BBox = [Infinity, Infinity, -Infinity, -Infinity];

	coordEach(object as AllGeoJSON, (coord) => {
		bbox = expandBBox(bbox, coord as Coordinate);
	});

	return bbox;
}

export function getGeometryFormatForType(type: Type): GeometryFormat | undefined {
	switch (type) {
		case 'json':
			return 'geojson';
		case 'text':
		case 'string':
			return 'wkt';
		case 'csv':
			return 'lnglat';
		default:
			return type.startsWith('geometry') ? 'native' : undefined;
	}
}

export function getSerializer(options: GeometryOptions): GeoJSONSerializer {
	const { geometryFormat } = options;

	switch (geometryFormat) {
		case 'native':
		case 'geojson':
			return (entry) => entry;
		case 'wkt':
			return (entry) => geojsonToWKT(entry);
		case 'lnglat':
			return (entry) => (entry as Point).coordinates;
		default:
			throw new Error(i18n.global.t('interfaces.map.invalid_format', { format: geometryFormat }) as string);
	}
}

export function getGeometryParser(options: GeometryOptions): (geom: any) => AnyGeometry {
	const { geometryFormat } = options;

	switch (geometryFormat) {
		case 'native':
		case 'geojson':
			return (geom) => geom as AnyGeometry;
		case 'wkt':
			return (geom) => wktToGeoJSON(geom) as AnyGeometry;
		case 'lnglat':
			return (geom) => ({ type: 'Point', coordinates: [Number(geom[0]), Number(geom[1])] }) as AnyGeometry;
		default:
			throw new Error(i18n.global.t('interfaces.map.invalid_format', { format: geometryFormat }) as string);
	}
}

export function getParser(options: GeometryOptions): GeoJSONParser {
	const parse = getGeometryParser(options);

	return function (entry: any) {
		const geomRaw = entry[options.geometryField];
		const geom = geomRaw && parse(geomRaw);
		if (!geom) return undefined;
		return geom;
	};
}

export function toGeoJSON(entries: any[], options: GeometryOptions): FeatureCollection {
	const parser = getParser(options);

	const geojson: FeatureCollection = {
		type: 'FeatureCollection',
		features: [],
		bbox: [Infinity, Infinity, -Infinity, -Infinity],
	};

	for (let i = 0; i < entries.length; i++) {
		const geometry = parser(entries[i]);
		if (!geometry) continue;
		const [a, b, c, d] = getBBox(geometry);
		geojson.bbox = expandBBox(geojson.bbox!, [a, b]);
		geojson.bbox = expandBBox(geojson.bbox!, [c, d]);
		const properties = { ...entries[i] };
		delete properties[options.geometryField];
		const feature = { type: 'Feature', properties, geometry };
		geojson.features.push(feature as Feature);
	}

	if (geojson.features.length == 0) {
		delete geojson.bbox;
	}

	return geojson;
}

export function flatten(geometry?: AnyGeometry): SimpleGeometry[] {
	if (!geometry) return [];

	if (geometry.type == 'GeometryCollection') {
		return geometry.geometries.flatMap(flatten);
	}

	if (geometry.type.startsWith('Multi')) {
		const type = geometry.type.replace('Multi', '');
		return (geometry.coordinates as any).map((coordinates: any) => ({ type, coordinates }) as SimpleGeometry);
	}

	return [geometry as SimpleGeometry];
}
