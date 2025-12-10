import type { AbstractServiceOptions } from '@directus/types';
import { withCache, type InvalidateFunction } from './with-cache.js';

export interface ShareInfo {
	collection: string;
	item: string;
	role: string | null;
	user_created: {
		id: string;
		role: string;
	};
}

export const fetchShareInfo = withCache('share-info', _fetchShareInfo, (shareId) => ({ shareId }));

export async function _fetchShareInfo(
	shareId: string,
	context: AbstractServiceOptions,
	invalidate: InvalidateFunction,
): Promise<ShareInfo> {
	const { SharesService } = await import('../../services/shares.js');
	const sharesService = new SharesService(context);

	return (await sharesService.readOne(shareId, {
		fields: ['collection', 'item', 'role', 'user_created.id', 'user_created.role'],
	})) as ShareInfo;
}
