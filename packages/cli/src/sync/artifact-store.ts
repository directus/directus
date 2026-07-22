import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../kernel/error.js';
import { writeFileAtomic } from '../kernel/write.js';
import { byCodepoint } from './codepoint.js';

/** The artifact ownership manifest filename. */
export const METADATA_FILE = 'metadata.json';

const OWNED_FILE = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;
const manifestSchema = z.looseObject({ files: z.array(z.string()) });

interface Artifact {
	readonly collection: string;
}

/** Files written and stale owned files removed by an artifact write. */
export interface ArtifactWriteResult {
	readonly written: string[];
	readonly removed: string[];
}

interface WriteState {
	readonly files: string[];
	readonly preserved: string[];
	readonly previousMetadata: unknown;
}

interface WriteArtifactsOptions<T extends Artifact> {
	readonly dir: string;
	readonly artifacts: readonly T[];
	readonly body: (artifact: T) => unknown;
	readonly manifestHint: string;
	readonly metadata: (state: WriteState) => unknown;
	readonly preserve?: {
		readonly parse: (value: unknown, name: string) => T;
		readonly when: (artifact: T) => boolean;
	};
}

interface ReadArtifactsOptions<T extends Artifact, M> {
	readonly dir: string;
	readonly kind: string;
	readonly missing: string;
	readonly missingHint: string;
	/** Parses the store's own metadata extras; the `files` manifest is validated here, not by adapters. */
	readonly parseMetadata: (value: unknown) => M;
	readonly parseArtifact: (value: unknown, name: string) => T;
}

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);

	if (isPlainObject(value)) {
		const record = value as Record<string, unknown>;

		return Object.fromEntries(
			Object.keys(record)
				.sort(byCodepoint)
				.map((key): [string, unknown] => [key, canonicalize(record[key])]),
		);
	}

	return value;
}

/** Serialize an artifact deterministically with sorted object keys and a trailing newline. */
export function serializeCanonical(value: unknown): string {
	return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function fileName(collection: string): string {
	const slug = collection
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	const hash = createHash('sha256').update(collection).digest('hex').slice(0, 16);
	return `${slug}_${hash}.json`;
}

function loadJson(path: string, name: string, hint?: string): unknown {
	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('STATE', `Cannot read ${name}.`, hint === undefined ? {} : { hint });
	}

	try {
		return JSON.parse(raw) as unknown;
	} catch {
		throw new CliError('STATE', `${name} is not valid JSON.`, hint === undefined ? {} : { hint });
	}
}

function readManifest(dir: string, hint: string): { files: string[]; metadata: unknown } {
	const path = join(dir, METADATA_FILE);

	if (!existsSync(path)) return { files: [], metadata: undefined };

	const metadata = loadJson(path, METADATA_FILE, hint);

	if (!isPlainObject(metadata)) {
		throw new CliError('STATE', `${METADATA_FILE} is not a valid manifest.`, { hint });
	}

	const parsed = manifestSchema.safeParse(metadata);

	if (!parsed.success) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "files" manifest.`, { hint });
	}

	return { files: parsed.data.files, metadata };
}

function readArtifact<T extends Artifact>(dir: string, name: string, parse: (value: unknown, name: string) => T): T {
	const path = join(dir, name);

	if (!existsSync(path)) {
		throw new CliError('STATE', `${METADATA_FILE} lists ${name}, but it is missing.`);
	}

	// lstat, not stat: a symlinked artifact must fail the regular-file check rather than be followed.
	if (!lstatSync(path).isFile()) {
		throw new CliError('STATE', `${name} is not a regular file.`);
	}

	const artifact = parse(loadJson(path, name), name);

	if (fileName(artifact.collection) !== name) {
		throw new CliError(
			'STATE',
			`${name} contains collection "${artifact.collection}", which does not match its filename.`,
		);
	}

	return artifact;
}

/** Write artifact files, remove stale owned files, then update the ownership manifest. */
export function writeArtifacts<T extends Artifact>(options: WriteArtifactsOptions<T>): ArtifactWriteResult {
	const { dir, artifacts, body, manifestHint, metadata, preserve } = options;
	mkdirSync(dir, { recursive: true });

	const previous = readManifest(dir, manifestHint);
	const byName = new Map<string, T>();

	for (const artifact of artifacts) {
		const name = fileName(artifact.collection);
		const clash = byName.get(name);

		if (clash !== undefined) {
			throw new CliError(
				'STATE',
				`Collections "${clash.collection}" and "${artifact.collection}" both map to ${name}.`,
			);
		}

		byName.set(name, artifact);
	}

	const targets = new Set<string>();
	const written: string[] = [];

	for (const [name, artifact] of byName) {
		targets.add(name);
		written.push(name);
		writeFileAtomic(join(dir, name), serializeCanonical(body(artifact)), 0o644);
	}

	const preserved: string[] = [];
	const removed: string[] = [];

	// Never infer ownership from the filename pattern alone; user files absent from the manifest survive.
	for (const name of previous.files) {
		if (targets.has(name) || !OWNED_FILE.test(name)) continue;

		if (preserve !== undefined && preserve.when(readArtifact(dir, name, preserve.parse))) {
			preserved.push(name);
			continue;
		}

		rmSync(join(dir, name), { force: true });
		removed.push(name);
	}

	// Write the manifest last so a first interrupted write is not readable and ownership never names files
	// this call has not processed. Existing generations are updated file-by-file, not transactionally.
	const files = [...written, ...preserved].sort(byCodepoint);
	const meta = metadata({ files, preserved, previousMetadata: previous.metadata });
	writeFileAtomic(join(dir, METADATA_FILE), serializeCanonical(meta), 0o644);

	return { written: [METADATA_FILE, ...written].sort(byCodepoint), removed: removed.sort(byCodepoint) };
}

/** Read and validate the artifact set named by its ownership manifest. */
export function readArtifacts<T extends Artifact, M>(
	options: ReadArtifactsOptions<T, M>,
): { metadata: M; artifacts: T[] } {
	const { dir, kind, missing, missingHint, parseMetadata, parseArtifact } = options;
	const metadataPath = join(dir, METADATA_FILE);

	if (!existsSync(dir) || !existsSync(metadataPath)) {
		throw new CliError('STATE', missing, { hint: missingHint });
	}

	const raw = loadJson(metadataPath, METADATA_FILE);

	if (!isPlainObject(raw)) {
		throw new CliError('STATE', `${METADATA_FILE} is not a ${kind} file.`);
	}

	const manifest = manifestSchema.safeParse(raw);

	if (!manifest.success) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "files" manifest.`);
	}

	const metadata = parseMetadata(raw);
	const artifacts: T[] = [];
	const seen = new Set<string>();

	for (const name of manifest.data.files) {
		if (!OWNED_FILE.test(name)) {
			throw new CliError('STATE', `${METADATA_FILE} lists ${name}, which is not an owned ${kind} file.`);
		}

		if (seen.has(name)) {
			throw new CliError('STATE', `${METADATA_FILE} lists ${name} more than once.`);
		}

		seen.add(name);
		artifacts.push(readArtifact(dir, name, parseArtifact));
	}

	artifacts.sort((a, b) => byCodepoint(a.collection, b.collection));
	return { metadata, artifacts };
}
