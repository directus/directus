export const TRACKED_METHODS = ['get', 'search', 'post', 'put', 'patch', 'delete'] as const;
export const TRACKED_KEYS = [...TRACKED_METHODS, 'cached'] as const;
