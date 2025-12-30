import { useUserStore } from '@/stores/user';
import { Accountability, Filter } from '@directus/types';
import { deepMap, parseFilter as parseFilterShared } from '@directus/utils';
import { get } from 'lodash';

/**
 * Additional context for app-specific dynamic variables.
 * These are only available in the frontend, not in the API.
 */
export interface AppFilterContext {
	/**
	 * Parent form values for nested forms in drawers/modals.
	 * Allows filters like: { "field": { "_eq": "$FORM.parentField" } }
	 */
	$FORM?: Record<string, any>;
}

/**
 * Parse a filter, replacing dynamic variables with their actual values.
 *
 * Supports standard Directus variables ($CURRENT_USER, $CURRENT_ROLE, etc.)
 * plus app-specific variables like $FORM for parent form context.
 *
 * @param filter - The filter to parse
 * @param appContext - Optional app-specific context (e.g., $FORM values)
 */
export function parseFilter(filter: Filter | null, appContext: AppFilterContext = {}): Filter {
	const { currentUser } = useUserStore();

	if (!currentUser) return filter ?? {};
	if (!('id' in currentUser)) return filter ?? {};

	// Handle $FORM dynamic variable (app-specific, not in shared utils)
	// This allows nested forms to reference parent form values
	let processedFilter = filter;

	if (appContext.$FORM && Object.keys(appContext.$FORM).length > 0) {
		processedFilter = deepMap(filter, (value: any) => {
			if (typeof value === 'string' && value.startsWith('$FORM')) {
				if (value === '$FORM') {
					return appContext.$FORM;
				}

				// Get nested path like $FORM.program or $FORM.nested.field
				const result = get(appContext, value, null);

				return result;
			}

			return value;
		});
	}

	const accountability: Accountability = {
		role: currentUser.role?.id ?? null,
		roles: currentUser.roles.map((role) => role.id),
		user: currentUser.id,
	} as Accountability;

	return (
		parseFilterShared(processedFilter, accountability, {
			$CURRENT_ROLE: currentUser.role ?? undefined,
			$CURRENT_ROLES: currentUser.roles,
			$CURRENT_USER: currentUser,
		}) ?? {}
	);
}
