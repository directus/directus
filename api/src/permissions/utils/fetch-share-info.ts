import { withCache } from '@directus/memory';
import type { AbstractServiceOptions } from '@directus/types';
import { useCache } from '../cache.js';
import emitter from '../../emitter.js';

export interface ShareInfo {
	collection: string;
	item: string;
	role: string | null;
	user_created: {
		id: string;
		role: string;
	};
}

export const fetchShareInfo = withCache(
	'share-info',
	_fetchShareInfo,
	useCache(),
	(shareId) => ({ shareId }),
	(invalidate, _, [shareId], { user_created }) => {
		// Don't need to invalidate create as we're fetching a single item

		emitter.onAction('directus_shares.update', function self({ keys, payload }) {
			if (
				keys.includes(shareId) &&
				('role' in payload || 'collection' in payload || 'item' in payload || 'user_created' in payload)
			) {
				invalidate();
				emitter.offAction('directus_shares.update', self);
			}
		});

		emitter.onAction('directus_users.update', function self({ keys, payload }) {
			if (keys.includes(user_created.id) && 'role' in payload) {
				invalidate();
				emitter.offAction('directus_users.update', self);
			}
		});

		emitter.onAction('directus_shares.delete', function self({ keys }) {
			if (keys.includes(shareId)) {
				invalidate();
				emitter.offAction('directus_shares.delete', self);
			}
		});

		emitter.onAction('directus_users.delete', function self({ keys }) {
			if (keys.includes(user_created.id)) {
				invalidate();
				emitter.offAction('directus_users.delete', self);
			}
		});

		// Do we need to care about on delete set null here?
		emitter.onAction('directus_roles.delete', function self({ keys }) {
			if (keys.includes(user_created.role)) {
				invalidate();
				emitter.offAction('directus_users.delete', self);
			}
		});
	},
);

export async function _fetchShareInfo(shareId: string, context: AbstractServiceOptions): Promise<ShareInfo> {
	const { SharesService } = await import('../../services/shares.js');
	const sharesService = new SharesService(context);

	return (await sharesService.readOne(shareId, {
		fields: ['collection', 'item', 'role', 'user_created.id', 'user_created.role'],
	})) as ShareInfo;
}
