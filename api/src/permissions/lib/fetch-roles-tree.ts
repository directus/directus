import { withCache } from '@directus/memory';
import { fetchRolesTree as _fetchRolesTree } from '@directus/utils/node';
import { useCache } from '../cache.js';
import emitter from '../../emitter.js';
import { intersection } from 'lodash-es';

/**
 * Fetches the roles tree starting from a specific role.
 */
export const fetchRolesTree = withCache(
	'roles-tree',
	_fetchRolesTree,
	useCache(),
	(start) => ({ start }),
	(invalidate, _, __, roles) => {
		// Don't have to invalidate on create as new roles can't be in the tree yet

		emitter.onAction('directus_roles.update', function self({ keys, payload }) {
			if (intersection(roles, keys).length > 0 && 'parent' in payload) {
				invalidate();
				emitter.offAction('directus_roles.update', self);
			}
		});

		emitter.onAction('directus_roles.delete', function self({ keys }) {
			if (intersection(roles, keys).length > 0) {
				invalidate();
				emitter.offAction('directus_roles.update', self);
			}
		});
	},
);
