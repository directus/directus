import { z } from 'zod';

const Ids = z.array(z.string().min(1)).optional();

export const RestoreInput = z
	.object({ collections: Ids, flows: Ids, seats: Ids, sso_users: Ids })
	.strict()
	.refine((input) => Object.values(input).some((ids) => ids && ids.length > 0), {
		message: 'Select at least one item to restore',
	});
