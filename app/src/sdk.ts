import type { AuthenticationClient, DirectusClient, RestClient } from '@directus/sdk';
import { createDirectus, rest, authentication } from '@directus/sdk';
import { getPublicURL } from '@/utils/get-root-path';

export type SdkClient = DirectusClient<any> & AuthenticationClient<any> & RestClient<any>;

export const sdk: SdkClient = createDirectus(getPublicURL())
	.with(authentication('session', { credentials: 'include', msRefreshBeforeExpires: 10_000 }))
	.with(rest({ credentials: 'include' }));

export default sdk;
