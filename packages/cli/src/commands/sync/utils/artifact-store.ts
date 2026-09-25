import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../../../kernel/error.js';
import { writeFileAtomic } from '../../../kernel/write.js';
import { byCodepoint } from './codepoint.js';

export const ARTIFACT_MANIFEST_FILE = 'metadata.json';

const OWNED_FILE = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;
const manifestSchema = z.looseObject({ files: z.array(z.string()) });

interface Artifact {
	readonly collection: string;
}

/** `removed` lists stale files the store owned, never files it did not write. */
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
	/** Only the store's own metadata extras; `files` is validated here, not by adapters. */
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

/** Sorted keys and a trailing newline, so an unchanged artifact produces an unchanged file. */
export function serializeCanonicalJson(value: unknown): string {
	return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

/** Deterministic, so readers can also use it to probe manifest membership. */
export function artifactFileName(collection: string): string {
	const slug = collection
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	const hash = createHash('sha256').update(collection).digest('hex').slice(0, 16);
	return `${slug}_${hash}.json`;
}

function readJsonFile(path: string, name: string, hint?: string): unknown {
	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('STATE', `Cannot read ${name}.`, { hint });
	}

	try {
		return JSON.parse(raw) as unknown;
	} catch {
		throw new CliError('STATE', `${name} is not valid JSON.`, { hint });
	}
}

export interface ArtifactManifest {
	readonly files: string[];
	readonly metadata: unknown;
}

/** undefined when the directory holds no manifest; throws when one exists but cannot be trusted. */
export function readArtifactManifest(
	dir: string,
	options: { invalid?: string | undefined; hint?: string | undefined } = {},
): ArtifactManifest | undefined {
	const { invalid = `${ARTIFACT_MANIFEST_FILE} is not a valid manifest.`, hint } = options;
	const path = join(dir, ARTIFACT_MANIFEST_FILE);

	if (!existsSync(path)) return undefined;

	// lstat prevents manifest symlinks from escaping the artifact root.
	if (!lstatSync(path).isFile()) {
		throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} is not a regular file.`, { hint });
	}

	const metadata = readJsonFile(path, ARTIFACT_MANIFEST_FILE, hint);

	if (!isPlainObject(metadata)) {
		throw new CliError('STATE', invalid, { hint });
	}

	const manifest = manifestSchema.safeParse(metadata);

	if (!manifest.success) {
		throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} is missing a valid "files" manifest.`, { hint });
	}

	return { files: manifest.data.files, metadata };
}

/** For readers that must survive corruption so a later pull can heal the directory. */
export function tryReadArtifactManifest(dir: string): ArtifactManifest | undefined {
	try {
		return readArtifactManifest(dir);
	} catch {
		return undefined;
	}
}

function readArtifactFile<T extends Artifact>(
	dir: string,
	name: string,
	parse: (value: unknown, name: string) => T,
): T {
	const path = join(dir, name);

	if (!existsSync(path)) {
		throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} lists ${name}, but it is missing.`);
	}

	if (!lstatSync(path).isFile()) {
		throw new CliError('STATE', `${name} is not a regular file.`);
	}

	const artifact = parse(readJsonFile(path, name), name);

	if (artifactFileName(artifact.collection) !== name) {
		throw new CliError(
			'STATE',
			`${name} contains collection "${artifact.collection}", which does not match its filename.`,
		);
	}

	return artifact;
}

export function writeArtifactStore<T extends Artifact>(options: WriteArtifactsOptions<T>): ArtifactWriteResult {
	const { dir, artifacts, body, manifestHint, metadata, preserve } = options;
	const previous = readArtifactManifest(dir, { hint: manifestHint });
	const byName = new Map<string, T>();

	for (const artifact of artifacts) {
		const name = artifactFileName(artifact.collection);
		const clash = byName.get(name);

		if (clash !== undefined) {
			throw new CliError(
				'STATE',
				`Collections "${clash.collection}" and "${artifact.collection}" both map to ${name}.`,
			);
		}

		byName.set(name, artifact);
	}

	const targets = new Set(byName.keys());
	const preserved: string[] = [];
	const removed: string[] = [];

	// Validate the whole previous generation before changing any file.
	for (const name of previous?.files ?? []) {
		if (targets.has(name) || !OWNED_FILE.test(name)) continue;

		// Forgetting a missing owned file could turn local corruption into remote mirror deletion.
		if (!existsSync(join(dir, name))) {
			throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} lists ${name}, but the file is missing.`, {
				hint: 'An interrupted pull or a deleted file can leave this state. Run a full pull for this project to rewrite it — a scoped pull cannot tell a crash from lost data.',
			});
		}

		if (preserve !== undefined && preserve.when(readArtifactFile(dir, name, preserve.parse))) {
			preserved.push(name);
			continue;
		}

		removed.push(name);
	}

	const written = [...byName.keys()];

	const serialized = new Map(
		[...byName].map(([name, artifact]) => [name, serializeCanonicalJson(body(artifact))] as const),
	);

	// Write ownership last so it never names files this call has not processed.
	const files = [...written, ...preserved].sort(byCodepoint);

	const serializedMetadata = serializeCanonicalJson(
		metadata({ files, preserved, previousMetadata: previous?.metadata }),
	);

	mkdirSync(dir, { recursive: true });

	for (const [name, contents] of serialized) writeFileAtomic(join(dir, name), contents, 0o644);
	for (const name of removed) rmSync(join(dir, name), { force: true });

	writeFileAtomic(join(dir, ARTIFACT_MANIFEST_FILE), serializedMetadata, 0o644);

	return { written: [ARTIFACT_MANIFEST_FILE, ...written].sort(byCodepoint), removed: removed.sort(byCodepoint) };
}

export function readArtifactStore<T extends Artifact, M>(
	options: ReadArtifactsOptions<T, M>,
): { metadata: M; artifacts: T[] } {
	const { dir, kind, missing, missingHint, parseMetadata, parseArtifact } = options;
	const manifest = readArtifactManifest(dir, { invalid: `${ARTIFACT_MANIFEST_FILE} is not a ${kind} file.` });

	if (manifest === undefined) {
		throw new CliError('STATE', missing, { hint: missingHint });
	}

	const metadata = parseMetadata(manifest.metadata);
	const artifacts: T[] = [];
	const seen = new Set<string>();

	for (const name of manifest.files) {
		if (!OWNED_FILE.test(name)) {
			throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} lists ${name}, which is not an owned ${kind} file.`);
		}

		if (seen.has(name)) {
			throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} lists ${name} more than once.`);
		}

		seen.add(name);
		artifacts.push(readArtifactFile(dir, name, parseArtifact));
	}

	artifacts.sort((a, b) => byCodepoint(a.collection, b.collection));
	return { metadata, artifacts };
}
