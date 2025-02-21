import { DeleteCollection, DeletePermissions } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { it } from 'vitest';

export function unseed(collection: string, permissions: number[], token: string) {
	it.each(vendors)(
		'%s',
		async (vendor) => {
			await DeleteCollection(vendor, { collection });
			await DeletePermissions(vendor, permissions, token);
			// @TODO delete policies, roles
		},
		300000,
	);
}
