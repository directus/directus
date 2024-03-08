import type { DirectusClient, RestClient } from '@directus/sdk';
import { createDirectus, rest, authentication } from '@directus/sdk';
import { getPublicURL } from './utils/get-root-path';

type SdkClient = DirectusClient<any> & RestClient<any>;

const sdk: SdkClient = createDirectus(getPublicURL())
	.with(authentication('session', { autoRefresh: false }))
	.with(rest());

export default sdk;
