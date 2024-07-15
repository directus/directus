import { SharesService } from '../../services/shares.js';
import type { Context } from '../types.js';
import { withCache } from './with-cache.js';

export interface ShareInfo {
	collection: string;
	item: string;
	fields: string[];
}

export const fetchShareInfo = withCache('share-info', _fetchShareInfo);

export async function _fetchShareInfo(shareId: string, context: Context): Promise<ShareInfo> {
	const sharesService = new SharesService(context);

	return (await sharesService.readOne(shareId, {
		fields: ['collection', 'item', 'fields'],
	})) as ShareInfo;
}
