import type { Knex } from 'knex';
import { describe, expect, it, vi } from 'vitest';
import { up, down } from './20250908A-add-editor-extension-support.js';

describe('20250908A-add-editor-extension-support', () => {
	describe('up migration', () => {
		it('should add editor column to directus_presets table', async () => {
			const mockColumn = { nullable: vi.fn() };
			const mockTable = { string: vi.fn().mockReturnValue(mockColumn) };
			const mockSchema = { alterTable: vi.fn() };

			const mockKnex = {
				schema: mockSchema,
			} as unknown as Knex;

			// Mock the callback execution
			mockSchema.alterTable.mockImplementation((tableName, callback) => {
				expect(tableName).toBe('directus_presets');
				callback(mockTable);
				return Promise.resolve();
			});

			await up(mockKnex);

			expect(mockSchema.alterTable).toHaveBeenCalledWith('directus_presets', expect.any(Function));
			expect(mockTable.string).toHaveBeenCalledWith('editor');
			expect(mockColumn.nullable).toHaveBeenCalled();
		});

		it('should propagate database errors', async () => {
			const mockSchema = {
				alterTable: vi.fn().mockRejectedValue(new Error('Database connection failed')),
			};

			const mockKnex = {
				schema: mockSchema,
			} as unknown as Knex;

			await expect(up(mockKnex)).rejects.toThrow('Database connection failed');
			expect(mockSchema.alterTable).toHaveBeenCalledWith('directus_presets', expect.any(Function));
		});
	});

	describe('down migration', () => {
		it('should remove editor column from directus_presets table', async () => {
			const mockTable = { dropColumn: vi.fn() };
			const mockSchema = { alterTable: vi.fn() };

			const mockKnex = {
				schema: mockSchema,
			} as unknown as Knex;

			mockSchema.alterTable.mockImplementation((tableName, callback) => {
				expect(tableName).toBe('directus_presets');
				callback(mockTable);
				return Promise.resolve();
			});

			await down(mockKnex);

			expect(mockSchema.alterTable).toHaveBeenCalledWith('directus_presets', expect.any(Function));
			expect(mockTable.dropColumn).toHaveBeenCalledWith('editor');
		});

		it('should propagate rollback errors', async () => {
			const mockSchema = {
				alterTable: vi.fn().mockRejectedValue(new Error('Rollback failed')),
			};

			const mockKnex = {
				schema: mockSchema,
			} as unknown as Knex;

			await expect(down(mockKnex)).rejects.toThrow('Rollback failed');
			expect(mockSchema.alterTable).toHaveBeenCalledWith('directus_presets', expect.any(Function));
		});
	});
});
