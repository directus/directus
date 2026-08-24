import type { RestCommand } from '../../types.js';
import type { SchemaDiffOutput } from './diff.js';

/**
 * Update the instance's schema by passing the diff previously retrieved via /schema/diff endpoint in the request body. This endpoint is only available to admin users.
 * @param diff JSON object containing hash and diffs of collections, fields, and relations to apply.
 * @returns Empty body.
 */
export const schemaApply =
	<Schema>(diff: SchemaDiffOutput, force = false): RestCommand<void, Schema> =>
	() => ({
		method: 'POST',
		path: '/schema/apply',
		params: force ? { force } : {},
		body: JSON.stringify(diff),
	});
