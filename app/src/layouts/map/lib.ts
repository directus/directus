import { DataType, GeometryType, GeometryFormat } from '@/types';
import {
	BBox,
	Point,
	Feature,
	FeatureCollection,
	Polygon,
	LineString,
	MultiPoint,
	MultiPolygon,
	MultiLineString,
	GeometryCollection,
	Geometry,
} from 'geojson';
import { render } from 'micromustache';
import { coordEach } from '@turf/meta';
import { i18n } from '@/lang';
import wkx from 'wkx';

export type GeometryOptions = {
	geometryField: string;
	geometryFormat: GeometryFormat;
	geometryType?: GeometryType;
};

export type SimpleGeometry = Point | Polygon | LineString;
export type MultiGeometry = MultiPoint | MultiPolygon | MultiLineString;

export type AnyGeoJSON = FeatureCollection | Feature | GeometryCollection | Geometry;
export type AllGeoJSON = FeatureCollection & Feature & GeometryCollection & Geometry;
export type GeoJSONParser = (entry: any) => Geometry | GeometryCollection | undefined;
export type GeoJSONSerializer = (entry: Geometry | GeometryCollection) => any;
type Coord = [number, number];

export function expandBBox(bbox: BBox, coord: Coord): BBox {
	return [
		Math.min(bbox[0], coord[0]),
		Math.min(bbox[1], coord[1]),
		Math.max(bbox[2], coord[0]),
		Math.max(bbox[3], coord[1]),
	];
}

export function getBBox(object: AnyGeoJSON): BBox {
	let bbox: BBox = [Infinity, Infinity, -Infinity, -Infinity];
	coordEach(object as AllGeoJSON, (coord) => {
		bbox = expandBBox(bbox, coord as Coord);
	});
	return bbox;
}

export function compatibleFormatsForType(type: DataType): GeometryFormat[] {
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

export function getSerializer(options: GeometryOptions): GeoJSONSerializer {
	const { geometryFormat } = options;
	switch (geometryFormat) {
		case 'native':
		case 'wkt':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toWkt();
		case 'wkb':
			return (entry: AnyGeoJSON) => wkx.Geometry.parseGeoJSON(entry).toWkb();
		case 'lnglat':
			return (entry: AnyGeoJSON) => (entry as Point).coordinates;
		case 'geojson':
			return (entry: AnyGeoJSON) => entry;
		default:
			throw new Error(i18n.t('interfaces.map.invalid_format', { format: geometryFormat }) as string);
	}
}

export function getGeometryParser(options: GeometryOptions): (geom: any) => AnyGeoJSON {
	const { geometryFormat } = options;
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

export function getParser(options: GeometryOptions): GeoJSONParser {
	const parse = getGeometryParser(options);

	return function (entry: any) {
		const geomRaw = entry[options.geometryField];
		const geom = geomRaw && parse(geomRaw);
		if (!geom) return undefined;
		geom.bbox = getBBox(geom);
		return geom;
	};
}

export function toGeoJSON(entries: any[], options: GeometryOptions, template: string): FeatureCollection {
	const parser = getParser(options);
	const geojson: FeatureCollection = {
		type: 'FeatureCollection',
		features: [],
		bbox: [Infinity, Infinity, -Infinity, -Infinity],
	};
	for (let i = 0; i < entries.length; i++) {
		const geometry = parser(entries[i]);
		if (!geometry) continue;
		const [a, b, c, d] = geometry.bbox!;
		geojson.bbox = expandBBox(geojson.bbox!, [a, b]);
		geojson.bbox = expandBBox(geojson.bbox!, [c, d]);
		const properties = { ...entries[i] };
		delete properties[options.geometryField];
		properties.description = render(template, entries[i]);
		const feature = { type: 'Feature', properties, geometry };
		geojson.features.push(feature as Feature);
	}
	if (geojson.features.length == 0) {
		delete geojson.bbox;
	}
	return geojson;
}

export function flatten(geometry?: Geometry): SimpleGeometry[] {
	if (!geometry) return [];
	if (geometry.type == 'GeometryCollection') {
		return geometry.geometries.flatMap(flatten);
	}
	if (geometry.type.startsWith('Multi')) {
		return geometry.coordinates.map(
			(coordinates: unknown) =>
				({
					type: geometry.type.replace('Multi', ''),
					coordinates,
				} as SimpleGeometry)
		);
	}
	return [geometry as SimpleGeometry];
}
