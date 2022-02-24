import { Field } from '@directus/shared/types';
import { deepMap } from '@directus/shared/utils';

export function generateConditionsFilterContext(fields: Field[]) {
	const requiredPermissionData = {
		$CURRENT_USER: [] as string[],
		$CURRENT_ROLE: [] as string[],
	};

	const extractPermissionData = (val: any) => {
		if (typeof val === 'string' && val.startsWith('$CURRENT_USER.')) {
			const fieldString = val.replace('$CURRENT_USER.', '');
			if (val && !requiredPermissionData.$CURRENT_USER.includes(fieldString)) {
				requiredPermissionData.$CURRENT_USER.push(fieldString);
			}
		}

		if (typeof val === 'string' && val.startsWith('$CURRENT_ROLE.')) {
			const fieldString = val.replace('$CURRENT_ROLE.', 'role.');
			if (val && !requiredPermissionData.$CURRENT_ROLE.includes(fieldString)) {
				requiredPermissionData.$CURRENT_ROLE.push(fieldString);
			}
		}

		return val;
	};

	const processConditions = (field: Field) => {
		if (field.meta && Array.isArray(field.meta?.conditions)) {
			deepMap(
				field.meta.conditions.map((condition) => condition.rule),
				extractPermissionData
			);
		}
	};

	fields.map((field) => processConditions(field));

	return requiredPermissionData;
}
