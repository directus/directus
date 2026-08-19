import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import { createConfigStore } from '../../../kernel/config/file.js';
import { CliError } from '../../../kernel/error.js';
import type { CliContext } from '../../../kernel/run.js';
import { createUi } from '../../../kernel/ui.js';
import { fetchRecords } from './api.js';
import { prepareDataPush, previewData } from './data-push.js';
import { writeDataFiles } from './data-store.js';
import type { Target } from './resolve-target.js';

vi.mock('./api.js', () => ({
	fetchRecords: vi.fn(() => Promise.resolve([])),
	importBatch: vi.fn(),
}));

describe('prepareDataPush skip and precondition', () => {
	const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token: 't' };
	let dir: string;

	function target(): Target {
		return {
			profile: 'staging',
			url: 'https://cms.example.com',
			credential,
			project: 'default',
			projectDir: dir,
			schemaDir: join(dir, 'schema'),
			dataDir: join(dir, 'data'),
			idMapPath: join(dir, 'id_map.json'),
			projectConfig: undefined,
		};
	}

	function ctx(): CliContext {
		return {
			cwd: dir,
			config: createConfigStore(dir),
			interactive: false,
			ui: createUi({ json: false, color: false }),
		};
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-datapush-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
		vi.mocked(fetchRecords).mockReset();
	});

	it('plans nothing for a schema-only checkout or an empty stored data set', async () => {
		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toBeUndefined();

		writeDataFiles(join(dir, 'data'), [], 'https://source.example.com');

		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toBeUndefined();
	});

	it('refuses loud when the stored data predates source tracking', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'r1' }] }],
			'https://source.example.com',
		);

		const metadataPath = join(dir, 'data', 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		delete metadata.source;
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
	});

	it('refuses a data file whose declared primaryKey contradicts the catalog, before any network', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_roles', primaryKey: 'name', records: [{ id: 'r1', name: 'Editor' }] }],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockClear();

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
		expect((error as CliError).message).toContain('directus_roles');
		expect((error as CliError).message).toContain('"name"');
		expect((error as CliError).message).toContain('"id"');
		expect(fetchRecords).not.toHaveBeenCalled();
	});

	it('refuses an unknown directus_* data file as an unsynced system collection, not as content', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_presets', primaryKey: 'id', records: [{ id: 1 }] }],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockClear();

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
		expect((error as CliError).message).toContain('system collections this CLI version does not sync');
		expect((error as CliError).message).toContain('directus_presets');
		expect((error as CliError).message).not.toMatch(/content collection/);
		expect(fetchRecords).not.toHaveBeenCalled();
	});

	it('uses a temporary numeric PK so the import response can map the assigned target ID', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_permissions',
					primaryKey: 'id',
					records: [{ id: 7, policy: null, collection: 'articles', action: 'read' }],
				},
			],
			'https://source.example.com',
		);

		const plan = await prepareDataPush(target(), 'merge', ctx());

		expect(plan?.batch).toEqual([
			{
				collection: 'directus_permissions',
				items: [{ id: -1, policy: null, collection: 'articles', action: 'read' }],
			},
		]);

		expect(plan?.systemSent).toEqual([
			{ collection: 'directus_permissions', records: [{ sourceId: '7', sentPk: '-1', temporary: true }] },
		]);
	});

	it('skips temporary keys the target already occupies, so an import can never match a real negative row', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_permissions',
					primaryKey: 'id',
					records: [
						{ id: 7, policy: null, collection: 'articles', action: 'read' },
						{ id: 8, policy: null, collection: 'articles', action: 'create' },
					],
				},
			],
			'https://source.example.com',
		);

		// A real target row at -1: sending it as a temporary key would make the server update that row.
		vi.mocked(fetchRecords).mockResolvedValue([{ id: -1, policy: null, collection: 'posts', action: 'update' }]);

		const plan = await prepareDataPush(target(), 'merge', ctx());

		expect(plan?.batch).toEqual([
			{
				collection: 'directus_permissions',
				items: [
					{ id: -2, policy: null, collection: 'articles', action: 'read' },
					{ id: -3, policy: null, collection: 'articles', action: 'create' },
				],
			},
		]);

		expect(plan?.systemSent).toEqual([
			{
				collection: 'directus_permissions',
				records: [
					{ sourceId: '7', sentPk: '-2', temporary: true },
					{ sourceId: '8', sentPk: '-3', temporary: true },
				],
			},
		]);
	});

	it('does not invent a mapping for a newly created singleton whose response cannot correlate its ID', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_settings',
					primaryKey: 'id',
					records: [{ id: 7, project_name: 'Example' }],
				},
			],
			'https://source.example.com',
		);

		const plan = await prepareDataPush(target(), 'merge', ctx());

		expect(plan?.batch).toEqual([{ collection: 'directus_settings', items: [{ project_name: 'Example' }] }]);

		expect(plan?.systemSent).toEqual([{ collection: 'directus_settings', records: [] }]);
	});

	it('reconciles a translation and sends its full single-record update to the target ID', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_translations',
					primaryKey: 'id',
					records: [{ id: 'source-id', language: 'en-US', key: 'greeting', value: 'Hello' }],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockResolvedValue([
			{ id: 'target-id', language: 'en-US', key: 'greeting', value: 'Old value' },
		]);

		const plan = await prepareDataPush(target(), 'mirror', ctx());

		expect(plan?.batch).toEqual([
			{
				collection: 'directus_translations',
				items: [{ id: 'target-id', language: 'en-US', key: 'greeting', value: 'Hello' }],
			},
		]);
	});

	it('previewData excludes the dependents of an ambiguous source along with it, keeping unaffected records', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					records: [
						{ id: 'r-amb', name: 'Editor' },
						{ id: 'r-ok', name: 'Viewer', icon: 'eye' },
					],
				},
				{
					collection: 'directus_access',
					primaryKey: 'id',
					records: [
						{ id: 'a-amb', role: 'r-amb', user: null, policy: null },
						{ id: 'a-ok', role: 'r-ok', user: null, policy: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/roles'
					? [
							{ id: 't-ed-1', name: 'Editor' },
							{ id: 't-ed-2', name: 'Editor' },
							{ id: 't-viewer', name: 'Viewer' },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [
				{ collection: 'directus_access', items: [{ id: 'a-ok', role: 't-viewer', user: null, policy: null }] },
				{ collection: 'directus_roles', items: [{ id: 't-viewer', name: 'Viewer', icon: 'eye' }] },
			],
			records: 2,
			matchedCount: 1,
			ambiguousCount: 1,
			dependentCount: 1,
			unmatchedCount: 1,
		});
	});

	it('reports one ambiguous folder and three dependent descendants separately', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_folders',
					primaryKey: 'id',
					records: [
						{ id: 'f-great', name: 'Logos', parent: 'f-grand' },
						{ id: 'f-grand', name: 'Icons', parent: 'f-child' },
						{ id: 'f-child', name: 'Images', parent: 'f-amb' },
						{ id: 'f-amb', name: 'Assets', parent: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/folders'
					? [
							{ id: 't-a1', name: 'Assets', parent: null },
							{ id: 't-a2', name: 'Assets', parent: null },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [{ collection: 'directus_folders', items: [] }],
			records: 0,
			matchedCount: 0,
			ambiguousCount: 1,
			dependentCount: 3,
			unmatchedCount: 0,
		});
	});

	it('previewData excludes a matched child of an ambiguous parent and moves it out of matchedCount', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_folders',
					primaryKey: 'id',
					records: [
						{ id: 'f-amb', name: 'Assets', parent: null },
						{ id: 'f-child', name: 'Images', parent: 'f-amb' },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/folders'
					? [
							{ id: 't-a1', name: 'Assets', parent: null },
							{ id: 't-a2', name: 'Assets', parent: null },
							{ id: 't-img', name: 'Images', parent: 't-a1' },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [{ collection: 'directus_folders', items: [] }],
			records: 0,
			matchedCount: 0,
			ambiguousCount: 1,
			dependentCount: 1,
			unmatchedCount: 0,
		});
	});

	it('previewData keeps a null-FK record when its collection has excluded records', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					records: [
						{ id: 'r-amb', name: 'Editor', parent: null },
						{ id: 'r-solo', name: 'Solo', parent: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/roles'
					? [
							{ id: 't-ed-1', name: 'Editor', parent: null },
							{ id: 't-ed-2', name: 'Editor', parent: null },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [{ collection: 'directus_roles', items: [{ id: 'r-solo', name: 'Solo', parent: null }] }],
			records: 1,
			matchedCount: 0,
			ambiguousCount: 1,
			dependentCount: 0,
			unmatchedCount: 1,
		});
	});

	it('previewData assembles the batch, tallies the reconcile counts, and never writes the ID map', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }],
			'https://source.example.com',
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toEqual({
			source: 'https://source.example.com',
			batch: [{ collection: 'directus_flows', items: [{ id: 'f1', name: 'Deploy' }] }],
			systemSent: [{ collection: 'directus_flows', records: [{ sourceId: 'f1', sentPk: 'f1' }] }],
			unchanged: new Map(),
			records: 1,
			matchedCount: 0,
			ambiguousCount: 0,
			dependentCount: 0,
			unmatchedCount: 1,
			unchangedCount: 0,
			incomplete: [],
		});

		expect(existsSync(join(dir, 'id_map.json'))).toBe(false);
	});
});
