export const DYNAMIC_VARIABLES = ['$NOW', '$CURRENT_USER', '$CURRENT_ROLE', '$CURRENT_ITEM'];

export function isDynamicVariable(value: any) {
	return typeof value === 'string' && DYNAMIC_VARIABLES.some((prefix) => value.startsWith(prefix));
}
