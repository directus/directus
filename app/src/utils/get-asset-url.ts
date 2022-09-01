import { addTokenToURL } from '@/api';
import { getPublicURL } from '@/utils/get-root-path';

export function getAssetUrl(filename: string, isDownload?: boolean): string {
	const assetUrl = new URL(`assets/${filename}`, getPublicURL());

	if (isDownload) {
		assetUrl.searchParams.set('download', '');
	}

	return addTokenToURL(assetUrl.href);
}
