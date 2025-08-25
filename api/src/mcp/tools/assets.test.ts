import type { Accountability, SchemaOverview } from '@directus/types';
import { Readable } from 'stream';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { AssetsService } from '../../services/assets.js';
import { assets } from './assets.js';

vi.mock('../../services/assets.js');

vi.mock('../tool.js', () => ({
	defineTool: vi.fn((config) => config),
}));

describe('assets tool', () => {
	const mockSchema = {} as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;
	const mockSanitizedQuery = { fields: ['*'] };

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('asset operations', () => {
		let mockAssetsService: {
			getAsset: MockedFunction<any>;
		};

		beforeEach(() => {
			mockAssetsService = {
				getAsset: vi.fn(),
			};

			vi.mocked(AssetsService).mockImplementation(() => mockAssetsService as unknown as AssetsService);
		});

		describe('READ asset', () => {
			test.each([null, 'application/pdf', 'text/plain'])(
				'should throw UnsupportedMediaType error for invalid file type',
				async (fileType) => {
					const assetId = 'asset-123';

					const mockAsset = {
						file: {
							type: fileType,
						},
						stream: new Readable(),
					};

					mockAssetsService.getAsset.mockResolvedValue(mockAsset);

					await expect(
						assets.handler({
							args: {
								id: assetId,
							},
							schema: mockSchema,
							accountability: mockAccountability,
							sanitizedQuery: mockSanitizedQuery,
						}),
					).rejects.toThrow(`Unsupported media type "${fileType}" in asset tool.`);
				},
			);

			test.each(['audio/wav', 'image/png'])(
				'should read asset and return base64 encoded data for valid file types',
				async (fileType) => {
					const assetId = 'asset-123';

					const mockChunks = [Buffer.from('chunk1'), Buffer.from('chunk2'), Buffer.from('chunk3')];

					// Create an async generator to simulate the stream
					async function* mockStream() {
						for (const chunk of mockChunks) {
							yield chunk;
						}
					}

					const mockAsset = {
						file: {
							type: fileType,
						},
						stream: mockStream(),
					};

					mockAssetsService.getAsset.mockResolvedValue(mockAsset);

					const result = await assets.handler({
						args: {
							id: assetId,
						},
						schema: mockSchema,
						accountability: mockAccountability,
						sanitizedQuery: mockSanitizedQuery,
					});

					expect(AssetsService).toHaveBeenCalledWith({
						accountability: mockAccountability,
						schema: mockSchema,
					});

					expect(mockAssetsService.getAsset).toHaveBeenCalledWith(assetId);

					const expectedBuffer = Buffer.concat(mockChunks);

					expect(result).toEqual({
						type: fileType.startsWith('image') ? 'image' : 'audio',
						data: expectedBuffer.toString('base64'),
						mimeType: fileType,
					});
				},
			);

			test('should handle empty stream', async () => {
				const assetId = 'asset-123';

				async function* emptyStream() {
					// Empty generator
				}

				const mockAsset = {
					file: { type: 'image/png' },
					stream: emptyStream(),
				};

				mockAssetsService.getAsset.mockResolvedValue(mockAsset);

				const result = await assets.handler({
					args: {
						id: assetId,
					},
					schema: mockSchema,
					accountability: mockAccountability,
					sanitizedQuery: mockSanitizedQuery,
				});

				expect(result).toEqual({
					type: 'image',
					data: Buffer.concat([]).toString('base64'),
					mimeType: 'image/png',
				});
			});
		});
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(assets.name).toBe('assets');
		});

		test('should have description', () => {
			expect(assets.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(assets.inputSchema).toBeDefined();
			expect(assets.validateSchema).toBeDefined();
		});
	});
});
