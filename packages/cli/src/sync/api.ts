import { schemaSnapshot } from '@directus/sdk';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { connect, mapRequestError } from '../kernel/connection.js';
import { parseSnapshot, type Snapshot } from './contract.js';

// The seam between the kernel connection and the sync contract: every sync API call
// gets its credential wiring, request timeout, error mapping, and boundary validation
// in one place. Diff and apply join here when the push slice lands.

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
