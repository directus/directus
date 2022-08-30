import { addTokenToURL } from '@/api';
import { getRootPath } from '@/utils/get-root-path';

export function getAssetUrl(filename: string, isDownload?: boolean): string {
	return addTokenToURL(getRootPath() + `assets/${filename}` + (isDownload ? '?download' : ''));
}
