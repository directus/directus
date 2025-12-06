import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { AssetsService } from '@/services/assets.js';
import { FilesService } from '@/services/files.js';
import { assets } from './index.js';

vi.mock('@/services/assets.js');
vi.mock('@/services/files.js');

describe('assets tool', () => {
	const mockSchema = {} as SchemaOverview;
	const mockAccountability = { user: 'test-user' } as Accountability;

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('asset operations', () => {
		let mockFilesService: {
			readOne: MockedFunction<any>;
		};

		let mockAssetsService: {
			getAsset: MockedFunction<any>;
		};

		beforeEach(() => {
			mockFilesService = {
				readOne: vi.fn(),
			};

			mockAssetsService = {
				getAsset: vi.fn(),
			};

			vi.mocked(AssetsService).mockImplementation(() => mockAssetsService as unknown as AssetsService);
			vi.mocked(FilesService).mockImplementation(() => mockFilesService as unknown as FilesService);
		});

		describe('READ asset', () => {
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

					mockAssetsService.getAsset.mockResolvedValue({
						file: {
							type: fileType,
						},
						stream: mockStream(),
					});

					mockFilesService.readOne.mockResolvedValue({
						type: fileType,
					});

					const result = await assets.handler({
						args: {
							id: assetId,
						},
						schema: mockSchema,
						accountability: mockAccountability,
					});

					expect(AssetsService).toHaveBeenCalledWith({
						accountability: mockAccountability,
						schema: mockSchema,
					});

					expect(mockFilesService.readOne).toHaveBeenCalledWith(assetId, { limit: 1 });
					expect(mockAssetsService.getAsset).toHaveBeenCalledWith(assetId, undefined);

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
				const fileType = 'image/png';

				async function* emptyStream() {
					// Empty generator
				}

				mockFilesService.readOne.mockResolvedValue({
					type: fileType,
				});

				mockAssetsService.getAsset.mockResolvedValue({
					file: {
						type: fileType,
					},
					stream: emptyStream(),
				});

				const result = await assets.handler({
					args: {
						id: assetId,
					},
					schema: mockSchema,
					accountability: mockAccountability,
				});

				expect(result).toEqual({
					type: 'image',
					data: Buffer.concat([]).toString('base64'),
					mimeType: 'image/png',
				});
			});

			describe('should downsize images larger that 1200px in width or height', () => {
				test('should downsize to 800px width if width>height', async () => {
					const assetId = 'asset-123';
					const fileType = 'image/png';

					const transforms = {
						transformationParams: {
							transforms: [['resize', { width: 800, fit: 'contain' }]],
						},
					};

					async function* emptyStream() {
						// Empty generator
					}

					mockFilesService.readOne.mockResolvedValue({
						type: fileType,
						width: 1300,
						height: 500,
					});

					mockAssetsService.getAsset.mockResolvedValue({
						file: {
							type: fileType,
						},
						stream: emptyStream(),
					});

					await assets.handler({
						args: {
							id: assetId,
						},
						schema: mockSchema,
						accountability: mockAccountability,
					});

					expect(mockAssetsService.getAsset).toBeCalledWith(assetId, transforms);
				});

				test('should downsize to 800px height if width<height', async () => {
					const assetId = 'asset-123';
					const fileType = 'image/png';

					const transforms = {
						transformationParams: {
							transforms: [['resize', { height: 800, fit: 'contain' }]],
						},
					};

					async function* emptyStream() {
						// Empty generator
					}

					mockFilesService.readOne.mockResolvedValue({
						type: fileType,
						width: 500,
						height: 1300,
					});

					mockAssetsService.getAsset.mockResolvedValue({
						file: {
							type: fileType,
						},
						stream: emptyStream(),
					});

					await assets.handler({
						args: {
							id: assetId,
						},
						schema: mockSchema,
						accountability: mockAccountability,
					});

					expect(mockAssetsService.getAsset).toBeCalledWith(assetId, transforms);
				});
			});
		});
	});

	describe('error handling', () => {
		let mockFilesService: {
			readOne: MockedFunction<any>;
		};

		let mockAssetsService: {
			getAsset: MockedFunction<any>;
		};

		beforeEach(() => {
			mockFilesService = {
				readOne: vi.fn(),
			};

			mockAssetsService = {
				getAsset: vi.fn(),
			};

			vi.mocked(AssetsService).mockImplementation(() => mockAssetsService as unknown as AssetsService);
			vi.mocked(FilesService).mockImplementation(() => mockFilesService as unknown as FilesService);
		});

		test.each([null, 'application/pdf', 'text/plain'])(
			'should throw UnsupportedMediaType error for invalid file type',
			async (fileType) => {
				const assetId = 'asset-123';

				mockFilesService.readOne.mockResolvedValue({
					type: fileType,
				});

				await expect(
					assets.handler({
						args: {
							id: assetId,
						},
						schema: mockSchema,
						accountability: mockAccountability,
					}),
				).rejects.toThrow(`Unsupported media type "${fileType === null ? 'unknown' : fileType}" in asset tool.`);

				expect(mockAssetsService.getAsset).not.toBeCalled();
			},
		);
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(assets.name).toBe('assets');
		});

		test('should not be admin tool', () => {
			expect(assets.admin).toBeUndefined();
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
