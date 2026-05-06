import getDatabase from '../../../database/index.js';
import { fetchUserCount } from '../../../utils/fetch-user-count/fetch-user-count.js';
import { entitlementManager } from '../manager.js';

/**
 * Counting the current amount of seats
 */
async function countActiveSeats() {
	const userCounts = await fetchUserCount({
		knex: getDatabase(),
	});

	return userCounts.admin + userCounts.app;
}

entitlementManager.registerCounter('seats', countActiveSeats);
