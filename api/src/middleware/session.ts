import expressSession, { Store } from 'express-session';
import env from '../env';
import { getConfigFromEnv } from '../utils/get-config-from-env';
import getDatabase from '../database';
let store: Store | undefined = undefined;

if (env.SESSION_STORE === 'redis') {
	const Redis = require('ioredis');
	const RedisStore = require('connect-redis')(expressSession);
	if (env.SESSION_REDIS_CLUSTER === true) {
		const redisClient = new Redis.Cluster(
			env.SESSION_REDIS || getConfigFromEnv('SESSION_REDIS_', 'SESSION_REDIS_CLUSTER'),
			{
				dnsLookup: (address: any, callback: (arg0: null, arg1: any) => any) => callback(null, address),
			}
		);
		store = new RedisStore({ client: redisClient });
	} else {
		const redisClient = new Redis(env.SESSION_REDIS || getConfigFromEnv('SESSION_REDIS_'));
		store = new RedisStore({ client: redisClient });
	}
}

if (env.SESSION_STORE === 'memcache') {
	const MemcachedStore = require('connect-memcached')(expressSession);
	store = new MemcachedStore(getConfigFromEnv('SESSION_MEMCACHE_'));
}

if (env.SESSION_STORE === 'database') {
	const KnexSessionStore = require('connect-session-knex')(expressSession);
	store = new KnexSessionStore({
		knex: getDatabase(),
		tablename: 'oauth_sessions', // optional. Defaults to 'sessions'
	});
}

export const session = expressSession({ store, secret: env.SECRET as string, saveUninitialized: false, resave: false });
