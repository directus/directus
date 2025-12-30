import { fixErrorToolCalls } from './fix-error-tool-calls.js';
import { describe, expect, it } from 'vitest';

describe('fixErrorToolCalls', () => {
	it('copies rawInput to input for error tool call without input', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_123',
						toolName: 'test-tool',
						rawInput: { foo: 'bar' },
						errorText: 'Something went wrong',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual([
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_123',
						toolName: 'test-tool',
						rawInput: { foo: 'bar' },
						input: { foo: 'bar' },
						errorText: 'Something went wrong',
					},
				],
			},
		]);
	});

	it('does not modify error tool call that already has input', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_456',
						toolName: 'test-tool',
						rawInput: { raw: 'data' },
						input: { existing: 'input' },
						errorText: 'Error occurred',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual(messages);
	});

	it('does not modify error tool call with only input (no rawInput)', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_789',
						toolName: 'test-tool',
						input: { only: 'input' },
						errorText: 'Error message',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual(messages);
	});

	it('does not modify successful tool call', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-output',
						state: 'output-available',
						toolCallId: 'call_success',
						toolName: 'test-tool',
						output: { result: 'success' },
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual(messages);
	});

	it('does not modify tool call without state field', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						toolCallId: 'call_in_progress',
						toolName: 'test-tool',
						input: { pending: 'data' },
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual(messages);
	});

	it('fixes multiple error tool calls in single assistant message', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_1',
						toolName: 'tool-1',
						rawInput: { data: 1 },
						errorText: 'Error 1',
					},
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_2',
						toolName: 'tool-2',
						rawInput: { data: 2 },
						errorText: 'Error 2',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual([
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_1',
						toolName: 'tool-1',
						rawInput: { data: 1 },
						input: { data: 1 },
						errorText: 'Error 1',
					},
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_2',
						toolName: 'tool-2',
						rawInput: { data: 2 },
						input: { data: 2 },
						errorText: 'Error 2',
					},
				],
			},
		]);
	});

	it('handles assistant message with mixed parts', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'text',
						text: 'Let me help you with that',
					},
					{
						type: 'reasoning',
						reasoning: 'I need to call a tool',
					},
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_error',
						toolName: 'error-tool',
						rawInput: { x: 1 },
						errorText: 'Failed',
					},
					{
						type: 'tool-output',
						state: 'output-available',
						toolCallId: 'call_success',
						toolName: 'success-tool',
						output: { y: 2 },
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual([
			{
				role: 'assistant',
				parts: [
					{
						type: 'text',
						text: 'Let me help you with that',
					},
					{
						type: 'reasoning',
						reasoning: 'I need to call a tool',
					},
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_error',
						toolName: 'error-tool',
						rawInput: { x: 1 },
						input: { x: 1 },
						errorText: 'Failed',
					},
					{
						type: 'tool-output',
						state: 'output-available',
						toolCallId: 'call_success',
						toolName: 'success-tool',
						output: { y: 2 },
					},
				],
			},
		]);
	});

	it('does not modify user message', () => {
		const messages = [
			{
				role: 'user',
				content: 'Hello, how are you?',
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual(messages);
	});

	it('returns empty array for empty messages array', () => {
		const messages = [] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual([]);
	});

	it('does not modify message without parts field', () => {
		const messages = [
			{
				role: 'assistant',
				content: 'This is a simple response',
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual(messages);
	});

	it('handles error tool call with input set to undefined explicitly', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_undefined',
						toolName: 'test-tool',
						rawInput: { should: 'copy' },
						input: undefined,
						errorText: 'Error',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual([
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_undefined',
						toolName: 'test-tool',
						rawInput: { should: 'copy' },
						input: { should: 'copy' },
						errorText: 'Error',
					},
				],
			},
		]);
	});

	it('handles error tool call with input set to null explicitly', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_null',
						toolName: 'test-tool',
						rawInput: { should: 'copy' },
						input: null,
						errorText: 'Error',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual([
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_null',
						toolName: 'test-tool',
						rawInput: { should: 'copy' },
						input: { should: 'copy' },
						errorText: 'Error',
					},
				],
			},
		]);
	});

	it('handles complex nested rawInput objects', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_complex',
						toolName: 'complex-tool',
						rawInput: {
							nested: {
								data: [1, 2, 3],
								obj: { key: 'value' },
							},
							array: ['a', 'b', 'c'],
						},
						errorText: 'Complex error',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result[0]?.parts?.[0]).toHaveProperty('input', {
			nested: {
				data: [1, 2, 3],
				obj: { key: 'value' },
			},
			array: ['a', 'b', 'c'],
		});
	});

	it('does not modify non-tool part types', () => {
		const messages = [
			{
				role: 'assistant',
				parts: [
					{
						type: 'text',
						text: 'Some text',
					},
					{
						type: 'image',
						url: 'https://example.com/image.png',
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result).toEqual(messages);
	});

	it('handles multiple messages with mixed scenarios', () => {
		const messages = [
			{
				role: 'user',
				content: 'User message',
			},
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-input-available',
						state: 'output-error',
						toolCallId: 'call_1',
						toolName: 'tool-1',
						rawInput: { fix: 'me' },
						errorText: 'Error 1',
					},
				],
			},
			{
				role: 'assistant',
				parts: [
					{
						type: 'tool-output',
						state: 'output-available',
						toolCallId: 'call_2',
						toolName: 'tool-2',
						output: { success: true },
					},
				],
			},
		] as const;

		const result = fixErrorToolCalls(messages as any);

		expect(result[0]).toEqual(messages[0]);
		expect(result[1]?.parts?.[0]).toHaveProperty('input', { fix: 'me' });
		expect(result[2]).toEqual(messages[2]);
	});
});
