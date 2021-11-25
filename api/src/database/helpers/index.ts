import { getDatabaseClient } from '..';
import { Knex } from 'knex';

import { GeometryHelper } from './geometry/types';
import { DateHelper } from './date/types';

import * as dateHelpers from './date';
import * as geometryHelpers from './geometry';

export type Helpers = {
	date: DateHelper;
	st: GeometryHelper;
};

export function getHelpers(database: Knex): Helpers {
	const client = getDatabaseClient(database);
	return {
		date: new dateHelpers[client](database),
		st: new geometryHelpers[client](database),
	};
}
