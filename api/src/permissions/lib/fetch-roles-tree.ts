import { fetchRolesTree as _fetchRolesTree } from '@directus/utils/node';
import { withCache } from '../utils/with-cache.js';

export const fetchRolesTree = withCache('roles-tree', _fetchRolesTree, (start) => ({ start }));
