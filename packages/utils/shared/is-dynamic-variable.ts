const dynamicVariablePrefixes = ['$NOW', '$CURRENT_USER', '$CURRENT_ROLE', '$CURRENT_ROLES', '$CURRENT_POLICIES'];

export function isDynamicVariable(value: any) {
	return typeof value === 'string' && dynamicVariablePrefixes.some((prefix) => value.startsWith(prefix));
}
