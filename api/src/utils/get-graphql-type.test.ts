import { TYPES } from '@directus/constants';
import type { Type } from '@directus/types';
import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLList, GraphQLString } from 'graphql';
import { GraphQLJSON } from 'graphql-compose';
import { describe, expect, test } from 'vitest';
import { GraphQLBigInt } from '../services/graphql/types/bigint.js';
import { GraphQLDate } from '../services/graphql/types/date.js';
import { GraphQLGeoJSON } from '../services/graphql/types/geojson.js';
import { GraphQLHash } from '../services/graphql/types/hash.js';
import { getGraphQLType } from './get-graphql-type.js';

describe('getGraphQLType', () => {
	test.each<[Type | 'alias' | 'unknown', unknown]>([
		['boolean', GraphQLBoolean],
		['bigInteger', GraphQLBigInt],
		['integer', GraphQLInt],
		['decimal', GraphQLFloat],
		['float', GraphQLFloat],
		['json', GraphQLJSON],
		['geometry', GraphQLGeoJSON],
		['geometry.Point', GraphQLGeoJSON],
		['geometry.LineString', GraphQLGeoJSON],
		['geometry.Polygon', GraphQLGeoJSON],
		['geometry.MultiPoint', GraphQLGeoJSON],
		['geometry.MultiLineString', GraphQLGeoJSON],
		['geometry.MultiPolygon', GraphQLGeoJSON],
		['time', GraphQLDate],
		['timestamp', GraphQLDate],
		['dateTime', GraphQLDate],
		['date', GraphQLDate],
		['hash', GraphQLHash],
		['uuid', GraphQLID],
		['string', GraphQLString],
		['text', GraphQLString],
		['binary', GraphQLString],
		['alias', GraphQLString],
		['unknown', GraphQLString],
	])('returns the GraphQL type for %s', (type, expected) => {
		expect(getGraphQLType(type, [])).toBe(expected);
	});

	test('returns a list of strings for csv', () => {
		const result = getGraphQLType('csv', []);

		expect(result).toBeInstanceOf(GraphQLList);
		expect((result as GraphQLList<typeof GraphQLString>).ofType).toBe(GraphQLString);
	});

	test.each<Type>(['string', 'integer', 'csv', 'geometry.Point'])('returns GraphQLHash for concealed %s', (type) => {
		expect(getGraphQLType(type, ['conceal'])).toBe(GraphQLHash);
	});

	test('returns GraphQLHash when conceal is among other specials', () => {
		expect(getGraphQLType('geometry.Point', ['cast-json', 'conceal'])).toBe(GraphQLHash);
	});

	test.each(TYPES.filter((type) => !type.startsWith('geometry')))('does not return GraphQLGeoJSON for %s', (type) => {
		expect(getGraphQLType(type, [])).not.toBe(GraphQLGeoJSON);
	});

	test('ignores specials other than conceal', () => {
		expect(getGraphQLType('string', ['cast-json'])).toBe(GraphQLString);
	});
});
