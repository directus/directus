import type { RestCommand } from '../../types.js';
import type { SchemaSnapshotOutput } from './snapshot.js';

// TODO improve typing
export type SchemaDiffOutput = {
	hash: string;
	diff: Record<string, any>;
};

export type SchemaDiffMode = 'merge' | 'mirror';

export type SchemaDiffOptions = {
	force?: boolean;
	mode?: SchemaDiffMode;
};

/**
 * Compare the current instance's schema against the schema snapshot in JSON request body and retrieve the difference. This endpoint is only available to admin users.
 * @param snapshot JSON object containing collections, fields, and relations to apply.
 * @param options Optional diff settings.
 * @param options.force Bypass version and database vendor restrictions.
 * @param options.mode `mirror` (default) returns all operations; `merge` excludes deletions for an additive diff.
 * @returns Returns the differences between the current instance's schema and the schema passed in the request body.
 */
export const schemaDiff =
	<Schema>(snapshot: SchemaSnapshotOutput, options: SchemaDiffOptions = {}): RestCommand<SchemaDiffOutput, Schema> =>
	() => {
		const params: Record<string, string | boolean> = {};

		if (options.force) params['force'] = options.force;
		if (options.mode && options.mode !== 'mirror') params['mode'] = options.mode;

		return {
			method: 'POST',
			path: '/schema/diff',
			params,
			body: JSON.stringify(snapshot),
		};
	};
