import { SharesService } from '../../services/shares.js';
import type { AbstractServiceOptions } from '../../types/services.js';
import { withCache } from './with-cache.js';

export interface ShareInfo {
	collection: string;
	item: string;
	user_created: {
		id: string;
		role: string;
	};
}

export const fetchShareInfo = withCache('share-info', _fetchShareInfo);

export async function _fetchShareInfo(shareId: string, context: AbstractServiceOptions): Promise<ShareInfo> {
	const sharesService = new SharesService(context);

	return (await sharesService.readOne(shareId, {
		fields: ['collection', 'item', 'user_created.id', 'user_created.role'],
	})) as ShareInfo;
}
