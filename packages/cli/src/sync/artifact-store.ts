import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../kernel/error.js';
import { writeFileAtomic } from '../kernel/write.js';
import { byCodepoint } from './codepoint.js';

/** The publish marker and ownership manifest for an artifact generation. */
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

interface ReadArtifactsOptions<T extends Artifact, M extends { readonly files: string[] }> {
	readonly dir: string;
	readonly kind: string;
	readonly missing: string;
	readonly missingHint: string;
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

/** Write a complete artifact generation and publish its ownership manifest last. */
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

	// Only files the previous manifest lists (and that match the owned pattern) are ever removed: the
	// store never deletes a file it didn't write, so a stray user file in the directory survives every
	// generation.
	for (const name of previous.files) {
		if (targets.has(name) || !OWNED_FILE.test(name)) continue;

		if (preserve !== undefined && preserve.when(readArtifact(dir, name, preserve.parse))) {
			preserved.push(name);
			continue;
		}

		rmSync(join(dir, name), { force: true });
		removed.push(name);
	}

	// The manifest is written LAST: read refuses a directory without it, so it is the publish marker for
	// this generation. An interrupted first write — artifacts on disk, manifest not — reads back as
	// "nothing to read" rather than a plausible partial set, and its `files` list is what the next read
	// and the next cleanup treat as owned.
	const files = [...written, ...preserved].sort(byCodepoint);
	const meta = metadata({ files, preserved, previousMetadata: previous.metadata });
	writeFileAtomic(join(dir, METADATA_FILE), serializeCanonical(meta), 0o644);

	return { written: [METADATA_FILE, ...written].sort(byCodepoint), removed: removed.sort(byCodepoint) };
}

/** Read and validate one committed artifact generation from its ownership manifest. */
export function readArtifacts<T extends Artifact, M extends { readonly files: string[] }>(
	options: ReadArtifactsOptions<T, M>,
): { metadata: M; artifacts: T[] } {
	const { dir, kind, missing, missingHint, parseMetadata, parseArtifact } = options;
	const metadataPath = join(dir, METADATA_FILE);

	if (!existsSync(dir) || !existsSync(metadataPath)) {
		throw new CliError('STATE', missing, { hint: missingHint });
	}

	const metadata = parseMetadata(loadJson(metadataPath, METADATA_FILE));
	const artifacts: T[] = [];
	const seen = new Set<string>();

	for (const name of metadata.files) {
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
