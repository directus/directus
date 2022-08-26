import { addTokenToURL } from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import { computed } from 'vue';

export function useAssetUrl(filename: string, isDownload?: boolean) {
	return computed(() => {
		return addTokenToURL(getRootPath() + `assets/${filename}` + (isDownload ? '?download' : ''));
	}).value;
}
