import type { UIMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { transformFilePartsForProvider } from './transform-file-parts.js';

describe('transformFilePartsForProvider', () => {
	it('should return messages unchanged when no parts exist', () => {
		const messages = [{ id: '1', role: 'user', content: 'hello' }] as UIMessage[];
		const result = transformFilePartsForProvider(messages);

		expect(result).toEqual(messages);
	});

	it('should pass through non-file parts unchanged', () => {
		const messages = [
			{
				id: '1',
				role: 'user',
				content: 'hello',
				parts: [{ type: 'text', text: 'hello' }],
			},
		] as UIMessage[];

		const result = transformFilePartsForProvider(messages);

		expect(result[0]!.parts).toEqual([{ type: 'text', text: 'hello' }]);
	});

	it('should pass through file parts without providerMetadata', () => {
		const messages = [
			{
				id: '1',
				role: 'user',
				content: '',
				parts: [{ type: 'file', mediaType: 'image/png', url: 'blob:http://localhost/abc' }],
			},
		] as UIMessage[];

		const result = transformFilePartsForProvider(messages);

		expect((result[0]!.parts[0] as any).url).toBe('blob:http://localhost/abc');
	});

	it('should pass through file parts without directus fileId', () => {
		const messages = [
			{
				id: '1',
				role: 'user',
				content: '',
				parts: [
					{
						type: 'file',
						mediaType: 'image/png',
						url: 'blob:http://localhost/abc',
						providerMetadata: { other: {} },
					},
				],
			},
		] as UIMessage[];

		const result = transformFilePartsForProvider(messages);

		expect((result[0]!.parts[0] as any).url).toBe('blob:http://localhost/abc');
	});

	it('should replace url with fileId when providerMetadata.directus.fileId exists', () => {
		const messages = [
			{
				id: '1',
				role: 'user',
				content: '',
				parts: [
					{
						type: 'file',
						mediaType: 'application/pdf',
						url: 'blob:http://localhost/abc',
						providerMetadata: {
							directus: { fileId: 'file_abc123', provider: 'anthropic' },
						},
					},
				],
			},
		] as UIMessage[];

		const result = transformFilePartsForProvider(messages);

		expect((result[0]!.parts[0] as any).url).toBe('file_abc123');
	});

	it('should handle mixed parts in a single message', () => {
		const messages = [
			{
				id: '1',
				role: 'user',
				content: '',
				parts: [
					{ type: 'text', text: 'check this file' },
					{
						type: 'file',
						mediaType: 'application/pdf',
						url: 'blob:http://localhost/abc',
						providerMetadata: {
							directus: { fileId: 'file_abc123', provider: 'anthropic' },
						},
					},
					{
						type: 'file',
						mediaType: 'image/png',
						url: 'blob:http://localhost/def',
					},
				],
			},
		] as UIMessage[];

		const result = transformFilePartsForProvider(messages);
		const parts = result[0]!.parts;

		expect((parts[0] as any).text).toBe('check this file');
		expect((parts[1] as any).url).toBe('file_abc123');
		expect((parts[2] as any).url).toBe('blob:http://localhost/def');
	});

	it('should handle multiple messages', () => {
		const messages = [
			{
				id: '1',
				role: 'user',
				content: '',
				parts: [
					{
						type: 'file',
						mediaType: 'application/pdf',
						url: 'blob:1',
						providerMetadata: { directus: { fileId: 'file_1', provider: 'openai' } },
					},
				],
			},
			{
				id: '2',
				role: 'assistant',
				content: 'Got it',
				parts: [{ type: 'text', text: 'Got it' }],
			},
			{
				id: '3',
				role: 'user',
				content: '',
				parts: [
					{
						type: 'file',
						mediaType: 'image/png',
						url: 'blob:2',
						providerMetadata: { directus: { fileId: 'file_2', provider: 'openai' } },
					},
				],
			},
		] as UIMessage[];

		const result = transformFilePartsForProvider(messages);

		expect((result[0]!.parts[0] as any).url).toBe('file_1');
		expect((result[1]!.parts[0] as any).text).toBe('Got it');
		expect((result[2]!.parts[0] as any).url).toBe('file_2');
	});
});
