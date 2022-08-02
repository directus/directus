import { SchemaOverview, Accountability } from '@directus/shared/types';
import { RolesService } from '../services/roles';
import { UsersService } from '../services/users';

export async function getFilterContext(
	schema: SchemaOverview,
	accountability: Accountability,
	requiredPermissionData: {
		$CURRENT_USER: string[];
		$CURRENT_ROLE: string[];
	}
) {
	const usersService = new UsersService({ schema });
	const rolesService = new RolesService({ schema });

	const filterContext: Record<string, any> = {};

	if (accountability.user && requiredPermissionData.$CURRENT_USER.length > 0) {
		filterContext.$CURRENT_USER = await usersService.readOne(accountability.user, {
			fields: requiredPermissionData.$CURRENT_USER,
		});
	}

	if (accountability.role && requiredPermissionData.$CURRENT_ROLE.length > 0) {
		filterContext.$CURRENT_ROLE = await rolesService.readOne(accountability.role, {
			fields: requiredPermissionData.$CURRENT_ROLE,
		});
	}

	return filterContext;
}
