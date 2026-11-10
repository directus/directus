import { describe, expect, it } from 'vitest';
import { isFileUploadProviderType } from './types.js';

describe('isFileUploadProviderType', () => {
	it('accepts only providers with a files API', () => {
		expect(
			['openai', 'anthropic', 'google', 'openrouter', 'openai-compatible', 'other', undefined].map(
				isFileUploadProviderType,
			),
		).toEqual([true, true, true, false, false, false, false]);
	});
});
