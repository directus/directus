const dynamicVariablePrefixes = ['$NOW', '$CURRENT_USER', '$CURRENT_ROLE', '$ITEM'];

export function isDynamicVariable(value: any) {
	return typeof value === 'string' && dynamicVariablePrefixes.some((prefix) => value.startsWith(prefix));
}
