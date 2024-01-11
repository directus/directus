import type { DirectusClient, RestClient } from '@directus/sdk';
import { createDirectus, rest } from '@directus/sdk';
import api from './api';
import { getPublicURL } from './utils/get-root-path';

type SdkClient = DirectusClient<any> & RestClient<any>;

const sdk: SdkClient = createDirectus(getPublicURL()).with(
	rest({
		onRequest: (req) => {
			const accessToken = api.defaults.headers.common['Authorization'] as string | undefined;

			if (!accessToken) return req;

			if (Array.isArray(req.headers)) {
				req.headers = [
					...req.headers.filter(([key]) => {
						return key.toLowerCase() !== 'authorization';
					}),
					['Authorization', accessToken],
				];
			} else if (req.headers instanceof Headers) {
				req.headers.set('Authorization', accessToken);
			} else {
				req.headers = {
					...(req.headers ?? {}),
					Authorization: accessToken,
				};
			}

			return req;
		},
	}),
);

export default sdk;
