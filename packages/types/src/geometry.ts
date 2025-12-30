import type { GeometryFormat, GeometryType } from './fields.js';
import type {
	Feature,
	FeatureCollection,
	Geometry,
	GeometryCollection,
	LineString,
	MultiLineString,
	MultiPoint,
	MultiPolygon,
	Point,
	Polygon,
} from 'geojson';

export type GeometryOptions = {
	geometryField: string;
	geometryFormat: GeometryFormat;
	geometryType?: GeometryType;
};

export type SimpleGeometry = Point | Polygon | LineString;
export type MultiGeometry = MultiPoint | MultiPolygon | MultiLineString;

export type AnyGeometry = Geometry | GeometryCollection;
export type AllGeoJSON = Geometry & GeometryCollection & Feature & FeatureCollection;
export type GeoJSONParser = (entry: any) => AnyGeometry | undefined;
export type GeoJSONSerializer = (entry: AllGeoJSON) => any;

export type Coordinate = [number, number];
