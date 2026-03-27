import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useLogger } from '../../../logger/index.js';
import { UtilsService } from '../../../services/utils.js';
import { getSchema } from '../../../utils/get-schema.js';
import assetsClear from './clear.js';

vi.mock('../../../logger/index.js', () => ({
	useLogger: vi.fn(),
}));

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../services/utils.js', () => ({
	UtilsService: vi.fn(),
}));

describe('assets clear command', () => {
	let mockLogger: any;
	let mockClearAssetVariants: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockLogger = { error: vi.fn() };
		mockClearAssetVariants = vi.fn().mockResolvedValue(undefined);

		vi.mocked(useLogger).mockReturnValue(mockLogger);
		vi.mocked(getSchema).mockResolvedValue({} as any);

		vi.mocked(UtilsService).mockImplementation(() => ({ clearAssetVariants: mockClearAssetVariants }) as any);

		vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
		vi.spyOn(process.stdout, 'write').mockImplementation((() => true) as any);
	});

	test('clears all variants when no file specified', async () => {
		await assetsClear({});

		expect(mockClearAssetVariants).toHaveBeenCalledWith({ files: undefined });
		expect(process.stdout.write).toHaveBeenCalledWith('Cleared asset variants successfully\n');
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	test('passes file array to service', async () => {
		await assetsClear({ files: ['abc-123'] });

		expect(mockClearAssetVariants).toHaveBeenCalledWith({ files: ['abc-123'] });
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	test('passes multiple files to service', async () => {
		await assetsClear({ files: ['abc-123', 'def-456'] });

		expect(mockClearAssetVariants).toHaveBeenCalledWith({ files: ['abc-123', 'def-456'] });
		expect(process.exit).toHaveBeenCalledWith(0);
	});

	test('creates service without accountability', async () => {
		await assetsClear({});

		expect(UtilsService).toHaveBeenCalledWith({
			schema: expect.anything(),
		});
	});

	test('logs error and exits with 1 on failure', async () => {
		const error = new Error('Storage failure');
		mockClearAssetVariants.mockRejectedValue(error);

		await assetsClear({});

		expect(mockLogger.error).toHaveBeenCalledWith(error);
		expect(process.exit).toHaveBeenCalledWith(1);
	});
});
