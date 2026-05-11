import type { Knex } from 'knex';
import getDatabase from '../../../database/index.js';
import { UsersService } from '../../../services/index.js';
import { fetchUserCount } from '../../../utils/fetch-user-count/fetch-user-count.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveSeats() {
	// license-TODO use simplified "fetchUserCount"
}

export async function countActiveSeats(opts?: { knex?: Knex | undefined }) {
	const userCounts = await fetchUserCount({
		knex: opts?.knex ?? getDatabase(),
	});

	return userCounts.admin + userCounts.app;
}

export async function resolveSeats(seats: string[], ctx?: { adminId: string }) {
	if (!ctx?.adminId) return;

	const usersService = new UsersService({ schema: await getSchema() });

	const users = seats.filter((user_id) => user_id !== ctx.adminId);

	await Promise.allSettled(
		users.map((user_id) => usersService.updateOne(user_id, { status: 'deactivated-license-exceeded' })),
	);
}
