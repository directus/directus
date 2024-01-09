import { authentication, createDirectus, rest } from '@directus/sdk';
import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk';
import { getPublicURL } from './utils/get-root-path';

type SdkClient<Schema extends object = any> = DirectusClient<Schema> &
	AuthenticationClient<Schema> &
	RestClient<Schema>;

const sdk: SdkClient = createDirectus(getPublicURL())
	.with(authentication('cookie', { credentials: 'include', msRefreshBeforeExpires: 10_000 }))
	.with(rest({ credentials: 'include' }));

export default sdk;
