import { createDirectus, rest } from '@directus/sdk';
import type { DirectusClient, RestClient } from '@directus/sdk';
import { getPublicURL } from './utils/get-root-path';
import api from './api';

type SdkClient = DirectusClient<any> & RestClient<any>;

const sdk: SdkClient = createDirectus(getPublicURL()).with(
	rest({
		onRequest: (req) => {
			if (!Array.isArray(req.headers) && req.headers instanceof Headers === false) {
				if (!req.headers) req.headers = {};
				// share the token managed by axios for now
				const authHeader = api.defaults.headers.common['Authorization'];

				if (authHeader) {
					req.headers['Authorization'] = authHeader.toString();
				}
			}

			return req;
		},
	}),
);

export default sdk;
