// This expression is a bit more relaxed than libraries like uuid and uuid-validate - see: https://github.com/directus/directus/issues/21573
const REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUuid(uuid: string): boolean {
	return REGEX.test(uuid);
}
