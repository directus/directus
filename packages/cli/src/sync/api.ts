import { schemaDiff, schemaSnapshot } from '@directus/sdk';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { connect, mapRequestError } from '../kernel/connection.js';
import { type DiffResult, parseDiffResult, parseSnapshot, type Snapshot } from './contract.js';

// The seam between the kernel connection and the sync contract: every sync API call
// gets its credential wiring, request timeout, error mapping, and boundary validation
// in one place. Apply joins here when the push slice lands.

export async function fetchSnapshot(credential: ResolvedCredential): Promise<Snapshot> {
	const client = connect(credential);

	let response: unknown;

	try {
		response = await client.request(schemaSnapshot());
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	return parseSnapshot(response);
}

export async function fetchDiff(
	credential: ResolvedCredential,
	snapshot: Snapshot,
	mode: 'merge' | 'mirror',
): Promise<DiffResult | null> {
	const client = connect(credential);

	let response: unknown;

	// `mode` is required, never defaulted: the server defaults to `mirror`, whose diff proposes
	// deleting everything the snapshot omits, so every caller must choose that outcome explicitly.
	try {
		response = await client.request(schemaDiff(snapshot, { mode }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	return parseDiffResult(response);
}
