import { getPublicURL } from '@/utils/get-root-path';
import type { AuthenticationClient, DirectusClient, RestClient, WebSocketClient } from '@directus/sdk';
import { authentication, createDirectus, realtime, rest } from '@directus/sdk';
import { ofetch, type FetchContext } from 'ofetch';
import { requestQueue } from './api';
import { SDK_AUTH_REFRESH_BEFORE_EXPIRES } from './constants';
import { useRequestsStore } from './stores/requests';

export type SdkClient = DirectusClient<unknown> &
	AuthenticationClient<unknown> &
	RestClient<unknown> &
	WebSocketClient<unknown>;

type OptionsWithId = FetchContext['options'] & { id: string };

const baseClient = ofetch.create({
	retry: 0,
	ignoreResponseError: true,
	async onRequest({ request, options }) {
		const requestsStore = useRequestsStore();
		const id = requestsStore.startRequest();
		(options as OptionsWithId).id = id;
		const path = getUrlPath(request);

		return new Promise((resolve) => {
			if (path && path === '/auth/refresh') {
				requestQueue.pause();
				return resolve();
			}

			requestQueue.add(() => resolve());
		});
	},
	async onResponse({ options }) {
		const requestsStore = useRequestsStore();
		const id = (options as OptionsWithId).id;
		if (id) requestsStore.endRequest(id);
	},
	async onResponseError({ options }) {
		const requestsStore = useRequestsStore();

		// Note: Cancelled requests don't respond with the config
		const id = (options as OptionsWithId).id;
		if (id) requestsStore.endRequest(id);
	},
	async onRequestError({ options }) {
		const requestsStore = useRequestsStore();

		// Note: Cancelled requests don't respond with the config
		const id = (options as OptionsWithId).id;
		if (id) requestsStore.endRequest(id);
	},
});

export const sdk: SdkClient = createDirectus(getPublicURL(), { globals: { fetch: baseClient.native } })
	.with(authentication('session', { credentials: 'include', msRefreshBeforeExpires: SDK_AUTH_REFRESH_BEFORE_EXPIRES }))
	.with(rest({ credentials: 'include' }))
	.with(realtime({ authMode: 'strict' }));

sdk.connect();

export default sdk;

function getUrlPath(request: FetchContext['request']): string | null {
	const uri = typeof request === 'string' ? request : request.url;

	try {
		return new URL(uri).pathname;
	} catch {
		return null;
	}
}
