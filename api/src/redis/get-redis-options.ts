import type { RedisOptions } from 'ioredis';
import { toNumber, toString } from 'lodash-es';
import { toBoolean } from '../utils/to-boolean.js';

export const getRedisOptions = (env: Record<string, unknown>): RedisOptions => {
	const options: RedisOptions = {};

	if ('REDIS_COMMAND_TIMEOUT' in env) {
		options.commandTimeout = toNumber(env['REDIS_COMMAND_TIMEOUT']);
	} else {
		options.commandTimeout = 1000;
	}

	if ('REDIS_CONNECTION_NAME' in env) {
		options.connectionName = toString(env['REDIS_CONNECTION_NAME']);
	} else {
		options.connectionName = 'directus';
	}

	if ('REDIS_CONNECT_TIMEOUT' in env) {
		options.connectTimeout = toNumber(env['REDIS_CONNECT_TIMEOUT']);
	} else {
		options.connectTimeout = 5000;
	}

	if ('REDIS_MAX_RETRIES_PER_REQUEST' in env) {
		options.maxRetriesPerRequest = toNumber(env['REDIS_MAX_RETRIES_PER_REQUEST']);
	} else {
		options.maxRetriesPerRequest = 20;
	}

	if ('REDIS_ENABLE_AUTO_PIPELINING' in env) {
		options.enableAutoPipelining = toBoolean(env['REDIS_ENABLE_AUTO_PIPELINING']);
	} else {
		options.enableAutoPipelining = true;
	}

	if ('REDIS_USERNAME' in env) {
		options.username = toString(env['REDIS_USERNAME']);
	}

	if ('REDIS_PASSWORD' in env) {
		options.password = toString(env['REDIS_PASSWORD']);
	}

	if ('REDIS_DB' in env) {
		options.db = toNumber(env['REDIS_DB']);
	}

	return options;
};
