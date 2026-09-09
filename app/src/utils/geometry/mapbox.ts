import type { RequestTransformFunction } from 'maplibre-gl';

const MAPBOX_API = 'https://api.mapbox.com';
const MAPBOX_SCHEME = 'mapbox://';

/**
 * Resolve a `mapbox://` URL to the api.mapbox.com endpoint it stands for.
 *
 * maplibre understood this scheme natively until v2 removed every Mapbox-specific code path, so a
 * style served from Mapbox is now just an opaque string it cannot fetch. Mapbox styles reference
 * their sprites, fonts and sources with the same scheme, which means resolving the style URL alone
 * is not enough: each of those forms has to be handled too, or the style loads and then renders
 * without icons, labels or tiles.
 *
 * Returns `null` for anything that is not a `mapbox://` URL.
 */
export function resolveMapboxUrl(url: string): string | null {
	if (!url.startsWith(MAPBOX_SCHEME)) return null;

	const path = url.slice(MAPBOX_SCHEME.length);

	// mapbox://styles/{user}/{styleId}
	if (path.startsWith('styles/')) {
		return `${MAPBOX_API}/styles/v1/${path.slice('styles/'.length)}`;
	}

	// mapbox://sprites/{user}/{styleId}, with maplibre's @2x/.png/.json suffixes already appended
	const sprite = /^sprites\/([^/]+)\/([^/]+?)((?:@\d+x)?\.\w+)?$/.exec(path);

	if (sprite) {
		const [, user, styleId, suffix = ''] = sprite;
		return `${MAPBOX_API}/styles/v1/${user}/${styleId}/sprite${suffix}`;
	}

	// mapbox://fonts/{user}/{fontstack}/{range}.pbf
	if (path.startsWith('fonts/')) {
		return `${MAPBOX_API}/fonts/v1/${path.slice('fonts/'.length)}`;
	}

	// mapbox://tiles/{tileset}/{z}/{x}/{y}{@2x}.{format}
	if (path.startsWith('tiles/')) {
		return `${MAPBOX_API}/v4/${path.slice('tiles/'.length)}`;
	}

	// Anything else is a bare tileset id referencing its TileJSON, e.g. mapbox://mapbox.satellite
	return `${MAPBOX_API}/v4/${path}.json?secure`;
}

/**
 * Append the access token, unless the URL already carries one. TileJSON responses hand back tile
 * URLs that may already be tokenised, and appending a second one makes Mapbox reject the request.
 */
function withAccessToken(url: string, accessToken: string): string {
	if (/[?&]access_token=/.test(url)) return url;
	return `${url}${url.includes('?') ? '&' : '?'}access_token=${accessToken}`;
}

/**
 * Build the `transformRequest` hook that stands in for the `accessToken` option maplibre dropped
 * in v2. It rewrites `mapbox://` URLs and tokenises every request bound for the Mapbox API,
 * including the plain https tile URLs that come back inside a TileJSON response. Requests to any
 * other host are passed through untouched, so a non-Mapbox basemap never sees the token.
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
