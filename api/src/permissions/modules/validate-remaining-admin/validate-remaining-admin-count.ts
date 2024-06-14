import { UnprocessableContentError } from '@directus/errors';

export function validateRemainingAdminCount(count: number) {
	if (count <= 0) {
		throw new UnprocessableContentError({
			reason: `Cannot remove the last admin user from the system`,
		});
	}
}
