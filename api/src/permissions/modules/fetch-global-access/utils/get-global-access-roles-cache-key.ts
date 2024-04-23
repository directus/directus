export function getGlobalAccessRolesCacheKey(roles: string[]) {
	return `gar-${roles.join('_')}`;
}
