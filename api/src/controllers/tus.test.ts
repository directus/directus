import { SchemaBuilder } from '@directus/schema-builder';
import { Metadata } from '@tus/utils';
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { validateAccess } from '../permissions/modules/validate-access/validate-access.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import { createMockRequest, createMockResponse, getRouteHandler } from '../test-utils/controllers.js';
import { default as router } from './tus.js';

vi.mock('../../src/database/index.js', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../services/tus/server.js', () => ({
	createTusServer: vi.fn(),
}));

const schema = new SchemaBuilder()
	.collection('directus_files', (c) => {
		c.field('id').integer().primary();
		c.field('title').string();
		c.field('filename_download').string();
		c.field('custom').integer();
	})
	.build();

describe('tus controller', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	describe('POST /', () => {
		test('calls next without validating when no accountability', async () => {
			const req = createMockRequest({ schema });
			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'POST', '/');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalled();
		});

		test('validates create access if no metadata', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const req = createMockRequest({ method: 'POST', accountability, schema });
			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'POST', '/');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				{
					action: 'create',
					collection: 'directus_files',
					accountability,
				},
				{ schema: req.schema, knex: expect.anything() },
			);

			expect(next).toHaveBeenCalled();
		});

		test('parses upload-metadata and includes fields in validation excluding id', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const metadataHeader = Metadata.stringify({ title: 'My File', filename_download: 'title.jpg' });

			const req = createMockRequest({
				method: 'POST',
				accountability,
				schema,
				header: vi.fn().mockReturnValue(metadataHeader),
			});

			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'POST', '/');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				{
					action: 'create',
					collection: 'directus_files',
					accountability,
					fields: ['title', 'filename_download'],
				},
				{ schema: req.schema, knex: expect.anything() },
			);
		});

		test('switches to update action with primaryKeys when metadata contains id', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const metadataHeader = Metadata.stringify({
				id: 'existing-file-id',
				title: 'Updated Title',
			});

			const req = createMockRequest({
				method: 'POST',
				accountability,
				schema,
				header: vi.fn().mockReturnValue(metadataHeader),
			});

			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'POST', '/');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				{
					action: 'update',
					collection: 'directus_files',
					accountability,
					primaryKeys: ['existing-file-id'],
					fields: ['title'],
				},
				{ schema: req.schema, knex: expect.anything() },
			);
		});

		test('should exclude id field in permissioned fields', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const metadataHeader = Metadata.stringify({ id: 'existing-file-id', title: 'The updated title' });

			const req = createMockRequest({
				method: 'POST',
				accountability,
				schema,
				header: vi.fn().mockReturnValue(metadataHeader),
			});

			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'POST', '/');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				expect.objectContaining({
					action: 'update',
					primaryKeys: ['existing-file-id'],
					fields: ['title'],
				}),
				{ schema: req.schema, knex: expect.anything() },
			);
		});

		test('throws INVALID_METADATA error for malformed upload-metadata header', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const req = createMockRequest({
				method: 'POST',
				accountability,
				schema,
				header: vi.fn().mockReturnValue('test ,'),
			});

			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'POST', '/');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).not.toHaveBeenCalled();
			expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_METADATA' }));
		});

		test('propagates validateAccess errors', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const accessError = new Error('Forbidden');

			vi.mocked(validateAccess).mockRejectedValueOnce(accessError);

			const req = createMockRequest({ method: 'POST', accountability, schema });
			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'POST', '/');
			await checkFileAccess?.handle(req, res, next);

			expect(next).toHaveBeenCalledWith(accessError);
		});
	});

	describe('PATCH /:id', () => {
		test('validates update access', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const req = createMockRequest({ method: 'PATCH', accountability, params: { id: 'file-1' }, schema });
			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'PATCH', '/:id');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				{
					action: 'update',
					collection: 'directus_files',
					accountability,
				},
				{ schema: req.schema, knex: expect.anything() },
			);
		});
	});

	describe('DELETE /:id', () => {
		test('validates delete access', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const req = createMockRequest({ method: 'DELETE', accountability, params: { id: 'file-1' }, schema });
			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'DELETE', '/:id');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				{
					action: 'delete',
					collection: 'directus_files',
					accountability,
				},
				{ schema: req.schema, knex: expect.anything() },
			);
		});
	});

	describe('OPTIONS /:id', () => {
		test('validates read access', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const req = createMockRequest({ method: 'OPTIONS', accountability, params: { id: 'file-1' }, schema });
			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'OPTIONS', '/:id');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				{
					action: 'read',
					collection: 'directus_files',
					accountability,
				},
				{ schema: req.schema, knex: expect.anything() },
			);
		});
	});

	describe('HEAD /:id', () => {
		test('validates read access', async () => {
			const accountability = createDefaultAccountability({
				user: 'user-1',
				role: 'role-1',
				roles: ['role-1'],
				admin: false,
			});

			const req = createMockRequest({ method: 'HEAD', accountability, params: { id: 'file-1' }, schema });
			const res = createMockResponse();
			const next = vi.fn();

			const [checkFileAccess] = getRouteHandler(router, 'HEAD', '/:id');
			await checkFileAccess?.handle(req, res, next);

			expect(validateAccess).toHaveBeenCalledWith(
				{
					action: 'read',
					collection: 'directus_files',
					accountability,
				},
				{ schema: req.schema, knex: expect.anything() },
			);
		});
	});
});
