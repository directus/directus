import {
	Point,
	Polygon,
	LineString,
	MultiPoint,
	MultiPolygon,
	MultiLineString,
	GeometryCollection,
	Geometry,
	Feature,
	FeatureCollection,
} from 'geojson';
import { GeometryType, GeometryFormat } from './fields';

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
