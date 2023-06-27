import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';

export function getKeyvInstance(store: Store, ttl: number | undefined, namespaceSuffix?: string): Keyv {
	switch (store) {
		case 'redis':
			return new Keyv(getConfig('redis', ttl, namespaceSuffix));
		case 'memory':
		default:
			return new Keyv(getConfig('memory', ttl, namespaceSuffix));
	}
}

function getConfig(store: Store = 'memory', ttl: number | undefined, namespaceSuffix = ''): Options<any> {
	const config: Options<any> = {
		namespace: `${env['CACHE_NAMESPACE']}${namespaceSuffix}`,
		ttl,
	};

	if (store === 'redis') {
		config.store = new KeyvRedis(env['REDIS'] || getConfigFromEnv('REDIS_'));
	}

	return config;
}
