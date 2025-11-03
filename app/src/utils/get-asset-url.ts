import { getPublicURL } from '@/utils/get-root-path';
import type { TransformationParams } from '@directus/types';

type AssetUrlOptions = {
	isDownload?: boolean;
	imageKey?: TransformationParams['key'];
	cacheBuster?: boolean | string | number | Date;
	[key: string]: any;
};

export function getAssetUrl(
	filename: string,
	{ isDownload = false, imageKey = undefined, cacheBuster = false, ...params }: AssetUrlOptions = {},
): string {
	const assetUrl = new URL(`assets/${filename}`, getPublicURL());

	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value === undefined || value === null) return;

			assetUrl.searchParams.set(key, String(value));
		});
	}

	if (isDownload) assetUrl.searchParams.set('download', '');
	if (imageKey) assetUrl.searchParams.set('key', imageKey);
	if (cacheBuster) assetUrl.searchParams.set('v', cacheBuster === true ? Date.now().toString() : String(cacheBuster));

	return assetUrl.href;
}

export function getFilesUrl() {
	const assetUrl = new URL(`assets/files`, getPublicURL());

	assetUrl.searchParams.set('download', '');

	return assetUrl.href;
}

export function getFolderUrl(folder: string) {
	const assetUrl = new URL(`assets/folder/${folder}`, getPublicURL());

	assetUrl.searchParams.set('download', '');

	return assetUrl.href;
}
