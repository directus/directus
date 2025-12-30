import { withCache } from '../utils/with-cache.js';
import { fetchRolesTree as _fetchRolesTree } from '@directus/utils/node';

/**
 * Fetches the roles tree starting from a specific role.
 */
export const fetchRolesTree = withCache('roles-tree', _fetchRolesTree, (start) => ({ start }));
