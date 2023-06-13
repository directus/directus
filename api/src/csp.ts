import { merge } from 'lodash-es';
import { getConfigFromEnv } from './utils/get-config-from-env.js';
import { getCache } from './cache.js';
import emitter from './emitter.js';
import getDatabase from './database/index.js';

export function contentSecurityPolicy(helmet: any) {
	const staticCSP = merge(
		{
			useDefaults: true,
			directives: {
				// Unsafe-eval is required for vue3 / vue-i18n / app extensions
				scriptSrc: ["'self'", "'unsafe-eval'"],

				// Even though this is recommended to have enabled, it breaks most local
				// installations. Making this opt-in rather than opt-out is a little more
				// friendly. Ref #10806
				upgradeInsecureRequests: null,

				// These are required for MapLibre
				workerSrc: ["'self'", 'blob:'],
				childSrc: ["'self'", 'blob:'],
				imgSrc: ["'self'", 'data:', 'blob:'],
				mediaSrc: ["'self'"],
				connectSrc: ["'self'", 'https://*'],
			},
		},
		getConfigFromEnv('CONTENT_SECURITY_POLICY_')
	);

	emitter.onAction('collections.update', updatePreviewUrls);
	emitter.onAction('collections.create', updatePreviewUrls);
	emitter.onAction('collections.delete', updatePreviewUrls);
	updatePreviewUrls();

	return async (req: unknown, res: unknown, next: unknown) => {
		const frameSrc = await getPreviewUrls();

		helmet.contentSecurityPolicy(
			merge(staticCSP, {
				directives: { frameSrc },
			})
		)(req, res, next);
	};
}

const FRAME_SRC_KEY = 'preview-frame-src';

export async function getPreviewUrls() {
	const { systemCache } = getCache();
	const urls: string = (await systemCache.get(FRAME_SRC_KEY)) ?? '';

	return ["'self'", ...urls.split(',')];
}

export async function setPreviewUrl(...urls: string[]) {
	const { systemCache } = getCache();
	if (urls.length === 0) return;
	const data: string = (await systemCache.get(FRAME_SRC_KEY)) ?? '';
	const list = new Set(data.length > 0 ? data.split(',') : []);

	urls.forEach((url) => {
		const { origin } = new URL(url);

		if (origin.length > 0) {
			list.add(origin);
		}
	});

	await systemCache.set(FRAME_SRC_KEY, Array.from(list).join(','));
}

async function updatePreviewUrls() {
	const database = getDatabase();
	if (!database) return;

	const urls = (await database.select('preview_url').from('directus_collections').whereNotNull('preview_url')).map(
		({ preview_url }) => preview_url
	);

	await setPreviewUrl(...urls);
}
