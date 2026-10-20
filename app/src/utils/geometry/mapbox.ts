import type { RequestTransformFunction } from 'maplibre-gl';

const MAPBOX_API = 'https://api.mapbox.com';
const MAPBOX_SCHEME = 'mapbox://';

/**
 * Resolve a `mapbox://` URL to the api.mapbox.com endpoint it stands for, or `null` if it is not
 * one. Mirrors mapbox-gl-js's `normalizeStyleURL` family, which maplibre dropped in v2.
 */
export function resolveMapboxUrl(url: string): string | null {
	if (!url.startsWith(MAPBOX_SCHEME)) return null;

	const path = url.slice(MAPBOX_SCHEME.length);

	// mapbox://styles/{user}/{styleId}
	if (path.startsWith('styles/')) {
		return `${MAPBOX_API}/styles/v1/${path.slice('styles/'.length)}`;
	}

	// mapbox://sprites/{user}/{styleId}[/{versionHash}], with maplibre's @2x/.png/.json suffix
	// already concatenated on. Depth is deliberately unconstrained; the suffix is split back off.
	if (path.startsWith('sprites/')) {
		const rest = path.slice('sprites/'.length);
		const suffix = /((?:@\d+x)?\.\w+)$/.exec(rest)?.[1] ?? '';
		const base = suffix ? rest.slice(0, -suffix.length) : rest;
		return `${MAPBOX_API}/styles/v1/${base}/sprite${suffix}`;
	}

	// mapbox://fonts/{user}/{fontstack}/{range}.pbf
	if (path.startsWith('fonts/')) {
		return `${MAPBOX_API}/fonts/v1/${path.slice('fonts/'.length)}`;
	}

	// mapbox://tiles/{tileset}/{z}/{x}/{y}{@2x}.{format}
	if (path.startsWith('tiles/')) {
		return `${MAPBOX_API}/v4/${path.slice('tiles/'.length)}`;
	}

	// A bare tileset id references its TileJSON, e.g. mapbox://mapbox.satellite, and is always a
	// single segment. Anything else is unrecognised: fail visibly rather than guess a URL that 404s.
	if (path.includes('/')) return null;

	return `${MAPBOX_API}/v4/${path}.json?secure`;
}

/** Append the access token, unless the URL already carries one from a TileJSON response. */
function withAccessToken(url: string, accessToken: string): string {
	if (/[?&]access_token=/.test(url)) return url;
	return `${url}${url.includes('?') ? '&' : '?'}access_token=${accessToken}`;
}

/**
 * Stands in for the `accessToken` map option maplibre dropped in v2. Other hosts pass through
 * untouched, so a non-Mapbox basemap never sees the token.
 */
export function getMapboxRequestTransformer(accessToken: string): RequestTransformFunction {
	return (url) => {
		const resolved = resolveMapboxUrl(url);

		if (resolved !== null) {
			return { url: withAccessToken(resolved, accessToken) };
		}

		if (url.startsWith(`${MAPBOX_API}/`)) {
			return { url: withAccessToken(url, accessToken) };
		}

		return undefined;
	};
}
