import { afterEach, describe, expect, test, vi } from 'vitest';
import { CUSTOM_LLM_FIELDS } from '../../../constants.js';
import { SettingsService } from '../../../services/index.js';
import { checkCustomLLM } from './custom-llms-enabled.js';

vi.mock('../../../services/index.js', async () => {
	const { mockItemsService } = await import('../../../test-utils/services/items-service.js');
	return { SettingsService: mockItemsService().ItemsService };
});

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../database/index.js', async () => {
	const { mockDatabase } = await import('../../../test-utils/database.js');
	return mockDatabase();
});

afterEach(() => {
	vi.clearAllMocks();
});

const setAllCustomLLMFields = (value: unknown) => Object.fromEntries(CUSTOM_LLM_FIELDS.map((key) => [key, value]));

describe('checkCustomLLM', () => {
	test('all CUSTOM_LLM_FIELDS null returns true', async () => {
		vi.mocked(SettingsService.prototype.readSingleton).mockResolvedValue(setAllCustomLLMFields(null));

		const result = await checkCustomLLM();

		expect(result).toBe(true);
	});

	test.each(CUSTOM_LLM_FIELDS)('field "%s" set in isolation returns false', async (field) => {
		vi.mocked(SettingsService.prototype.readSingleton).mockResolvedValue({
			...setAllCustomLLMFields(null),
			[field]: 'value',
		});

		const result = await checkCustomLLM();

		expect(result).toBe(false);
	});

	test('all CUSTOM_LLM fields set returns false', async () => {
		vi.mocked(SettingsService.prototype.readSingleton).mockResolvedValue({ ...setAllCustomLLMFields('set') });

		const result = await checkCustomLLM();

		expect(result).toBe(false);
	});

	test('field set to empty string count as configured returns false', async () => {
		vi.mocked(SettingsService.prototype.readSingleton).mockResolvedValue({
			...setAllCustomLLMFields(null),
			ai_openai_compatible_base_url: '',
		});

		const result = await checkCustomLLM();

		expect(result).toBe(false);
	});
});
