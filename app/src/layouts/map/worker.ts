import { expose } from 'comlink';
import { toGeoJSON } from './lib';

expose(toGeoJSON);
export type GeoJSONSerializer = typeof toGeoJSON;
