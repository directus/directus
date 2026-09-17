import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getUID } from './getUID.js';

/**
 * Ports reserved for sandboxes that pick their own, kept clear of the per project baselines and
 * above 10080, the highest port `fetch` refuses to talk to.
 */
const FIRST = 11_000;
/** How many sandboxes a single test file can keep apart. */
const SLOTS = 10;
/** Ports per slot, so a sandbox running several instances still has room next to its own port. */
const STRIDE = 4;

const SUFFIX = '.sb.test.ts';

let files: string[] | undefined;

/** Ensures each sandbox file has a unique index */
function getFiles(): string[] {
	if (files) return files;

	const root = join(import.meta.dirname, '..', 'tests');

	files = readdirSync(root, { recursive: true, encoding: 'utf8' })
		.filter((path) => path.endsWith(SUFFIX))
		.map((path) => path.slice(0, -SUFFIX.length).split(/[/\\]/g).join('_'))
		.sort();

	return files;
}

/**
 * A port of its own for a sandbox, derived from the calling test file.
 *
 * Pass a different `slot` for each sandbox a single file starts.
 */
export function sandboxPort(slot = 0): number {
	const uid = getUID(1);
	const index = getFiles().indexOf(uid);

	if (index === -1) {
		throw new Error(`No sandbox port window for "${uid}". Only "*${SUFFIX}" files get one.`);
	}

	return FIRST + index * SLOTS * STRIDE + (slot % SLOTS) * STRIDE;
}
